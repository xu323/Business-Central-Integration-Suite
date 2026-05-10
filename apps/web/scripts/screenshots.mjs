/**
 * Playwright screenshot harness.
 *
 * Usage:
 *   API:  cd apps/api && uvicorn app.main:app --port 8365
 *   Web:  cd apps/web && npm run dev
 *   Run:  cd apps/web && node scripts/screenshots.mjs <phase>   (default: phase2)
 *
 * Output: outputs/screenshots/<phase>/<page>.<lang>.png
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const PHASE = process.argv[2] ?? "phase2";
const BASE = process.env.WEB_BASE ?? "http://localhost:5365";
const API_BASE = process.env.API_BASE ?? "http://127.0.0.1:8365";
const OUT_DIR = resolve("..", "..", "outputs", "screenshots", PHASE);
const VIEWPORT = { width: 1440, height: 900 };

const STATIC_NOW = new Date("2026-05-10T10:00:00Z");

const PAGES = [
  { name: "01-dashboard",          lang: "zh-TW", path: "/" },
  { name: "02-request-list",       lang: "zh-TW", path: "/requests" },
  { name: "03-create-request",     lang: "zh-TW", path: "/requests/new" },
  { name: "04-request-detail",     lang: "zh-TW", detail: true },
  { name: "05-audit-logs",         lang: "zh-TW", path: "/audit" },
  // Cross-language reference shots.
  { name: "06-request-list-en",    lang: "en",    path: "/requests" },
  { name: "07-request-detail-ja",  lang: "ja",    detail: true },
  // Interactive: open the Vendor Lookup dialog on the Create page.
  { name: "08-vendor-lookup",      lang: "zh-TW", path: "/requests/new", interaction: "vendor-lookup" },
];

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();

async function fetchFirstId() {
  const list = await (await fetch(`${API_BASE}/api/purchase-requests`)).json();
  return Array.isArray(list) && list[0] ? list[0].id : null;
}

for (const target of PAGES) {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    locale: target.lang,
    timezoneId: "Asia/Taipei",
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript((lang) => {
    window.localStorage.setItem("bcsuite.lang", lang);
    window.localStorage.setItem("bcsuite.density", "standard");
  }, target.lang);
  ctx.clock?.install?.({ time: STATIC_NOW });

  const page = await ctx.newPage();
  const url = target.detail
    ? `${BASE}/requests/${await fetchFirstId()}`
    : `${BASE}${target.path}`;
  process.stdout.write(`→ ${target.name} [${target.lang}]: ${url}\n`);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);

  if (target.interaction === "vendor-lookup") {
    const button = page.locator('button:has-text("搜尋")').first();
    if ((await button.count()) > 0) {
      await button.click();
      await page.waitForTimeout(400);
    }
  }

  const out = resolve(OUT_DIR, `${target.name}.${target.lang}.png`);
  await page.screenshot({ path: out, fullPage: target.interaction !== "vendor-lookup" });
  process.stdout.write(`  saved ${out}\n`);

  await ctx.close();
}

await browser.close();
process.stdout.write(`\nPhase ${PHASE} screenshots complete: ${OUT_DIR}\n`);
