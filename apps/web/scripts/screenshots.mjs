/**
 * Playwright screenshot harness for the web Dashboard.
 *
 * Usage:
 *   API:  cd apps/api && uvicorn app.main:app --port 8000
 *   Web:  cd apps/web && npm run dev
 *   Run:  cd apps/web && node scripts/screenshots.mjs <phase>   (default: phase2)
 *
 * Output: outputs/screenshots/<phase>/<page>.zh-TW.png
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const PHASE = process.argv[2] ?? "phase2";
const BASE = process.env.WEB_BASE ?? "http://localhost:5173";
// Note: server-side fetch goes through 127.0.0.1 to bypass IPv6 resolution quirks;
// browser-side requests use localhost so they match the API's CORS allowlist.
const API_BASE = process.env.API_BASE ?? "http://127.0.0.1:8000";
const OUT_DIR = resolve("..", "..", "outputs", "screenshots", PHASE);
const VIEWPORT = { width: 1440, height: 900 };

const PAGES = [
  { name: "01-dashboard",       path: "/" },
  { name: "02-request-list",    path: "/requests" },
  { name: "03-create-request",  path: "/requests/new" },
  { name: "04-request-detail",  path: "/requests" }, // navigate then click first row
  { name: "05-audit-logs",      path: "/audit" },
];

const STATIC_NOW = new Date("2026-05-10T10:00:00Z");

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: VIEWPORT,
  locale: "zh-TW",
  timezoneId: "Asia/Taipei",
  deviceScaleFactor: 2,
});

// Force language preference to zh-TW & freeze the clock so screenshots are reproducible.
await ctx.addInitScript(() => {
  window.localStorage.setItem("bcsuite.lang", "zh-TW");
});
ctx.clock?.install?.({ time: STATIC_NOW });

const page = await ctx.newPage();

for (const target of PAGES) {
  const url = `${BASE}${target.path}`;
  process.stdout.write(`→ ${target.name}: ${url}\n`);
  await page.goto(url, { waitUntil: "networkidle" });

  // Detail page needs an actual id — fetch one from API directly.
  if (target.name === "04-request-detail") {
    const list = await (await fetch(`${API_BASE}/api/purchase-requests`)).json();
    const first = Array.isArray(list) && list[0] ? list[0].id : null;
    if (!first) {
      process.stdout.write("  (no requests in DB; skipped)\n");
      continue;
    }
    await page.goto(`${BASE}/requests/${first}`, { waitUntil: "networkidle" });
  }

  // Wait for table or skeleton to settle.
  await page.waitForTimeout(700);

  const out = resolve(OUT_DIR, `${target.name}.zh-TW.png`);
  await page.screenshot({ path: out, fullPage: true });
  process.stdout.write(`  saved ${out}\n`);
}

await ctx.close();
await browser.close();
process.stdout.write(`\nPhase ${PHASE} screenshots complete: ${OUT_DIR}\n`);
