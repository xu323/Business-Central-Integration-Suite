/**
 * Phase 5 final screenshot harness — 10 pages × {zh-TW, en, ja} = 30 PNGs.
 *
 * Run:
 *   API:  cd apps/api && uvicorn app.main:app --port 8000
 *   Web:  cd apps/web && npm run dev -- --port 5193
 *   Run:  cd apps/web && WEB_BASE=http://localhost:5193 \
 *           API_BASE=http://127.0.0.1:8000 \
 *           node scripts/screenshots-final.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const BASE = process.env.WEB_BASE ?? "http://localhost:5173";
const API_BASE = process.env.API_BASE ?? "http://127.0.0.1:8000";
const OUT_DIR = resolve("..", "..", "outputs", "screenshots", "final");
const VIEWPORT = { width: 1440, height: 900 };
const STATIC_NOW = new Date("2026-05-10T10:00:00Z");
const LANGS = ["zh-TW", "en", "ja"];

async function fetchFirstId() {
  const list = await (await fetch(`${API_BASE}/api/purchase-requests`)).json();
  return Array.isArray(list) && list[0] ? list[0].id : null;
}

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();

const detailId = await fetchFirstId();

const JOBS = [
  {
    name: "01-dashboard",
    build: async (page) => {
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      return { url: `${BASE}/` };
    },
    fullPage: true,
  },
  {
    name: "02-request-list",
    build: async (page) => {
      await page.goto(`${BASE}/requests`, { waitUntil: "networkidle" });
      return { url: `${BASE}/requests` };
    },
    fullPage: true,
  },
  {
    name: "03-request-list-filtered",
    build: async (page) => {
      const url = `${BASE}/requests?status=Submitted&hr=1`;
      await page.goto(url, { waitUntil: "networkidle" });
      return { url };
    },
    fullPage: true,
  },
  {
    name: "04-request-list-bulk",
    build: async (page) => {
      await page.goto(`${BASE}/requests`, { waitUntil: "networkidle" });
      // Tick the first two row checkboxes (skip the header).
      const checkboxes = page.locator('input[aria-label="Select row"]');
      const count = await checkboxes.count();
      for (let i = 0; i < Math.min(2, count); i += 1) {
        await checkboxes.nth(i).check({ force: true });
      }
      await page.waitForTimeout(200);
      return { url: `${BASE}/requests` };
    },
    fullPage: true,
  },
  {
    name: "05-create-request",
    build: async (page) => {
      await page.goto(`${BASE}/requests/new`, { waitUntil: "networkidle" });
      return { url: `${BASE}/requests/new` };
    },
    fullPage: true,
  },
  {
    name: "06-vendor-lookup",
    build: async (page) => {
      await page.goto(`${BASE}/requests/new`, { waitUntil: "networkidle" });
      // Click the Vendor search button (label varies by locale).
      const searchButton = page
        .locator('button')
        .filter({ has: page.locator('svg') })
        .filter({ hasText: /搜尋|Search|検索/ })
        .first();
      await searchButton.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);
      return { url: `${BASE}/requests/new` };
    },
    fullPage: false, // dialog clipped to viewport is more legible
  },
  {
    name: "07-request-detail",
    build: async (page, { detailId }) => {
      const url = `${BASE}/requests/${detailId}`;
      await page.goto(url, { waitUntil: "networkidle" });
      return { url };
    },
    fullPage: true,
  },
  {
    name: "08-request-detail-print",
    build: async (page, { detailId }) => {
      const url = `${BASE}/requests/${detailId}`;
      await page.goto(url, { waitUntil: "networkidle" });
      await page.emulateMedia({ media: "print" });
      await page.waitForTimeout(200);
      return { url };
    },
    emulatePrint: true,
    fullPage: true,
  },
  {
    name: "09-audit-logs",
    build: async (page) => {
      await page.goto(`${BASE}/audit`, { waitUntil: "networkidle" });
      return { url: `${BASE}/audit` };
    },
    fullPage: true,
  },
  {
    name: "10-not-found",
    build: async (page) => {
      const url = `${BASE}/this-route-does-not-exist`;
      await page.goto(url, { waitUntil: "networkidle" });
      return { url };
    },
    fullPage: false,
  },
];

let total = 0;
for (const lang of LANGS) {
  for (const job of JOBS) {
    const ctx = await browser.newContext({
      viewport: VIEWPORT,
      locale: lang,
      timezoneId: "Asia/Taipei",
      deviceScaleFactor: 2,
    });
    await ctx.addInitScript((l) => {
      window.localStorage.setItem("bcsuite.lang", l);
      window.localStorage.setItem("bcsuite.density", "standard");
    }, lang);
    ctx.clock?.install?.({ time: STATIC_NOW });

    const page = await ctx.newPage();
    const { url } = await job.build(page, { detailId });
    await page.waitForTimeout(400);
    const out = resolve(OUT_DIR, `${job.name}.${lang}.png`);
    await page.screenshot({ path: out, fullPage: !!job.fullPage });
    process.stdout.write(`✓ ${job.name} [${lang}] ← ${url}\n`);
    total += 1;
    await ctx.close();
  }
}

await browser.close();
process.stdout.write(`\nFinal screenshots complete: ${total} PNGs in ${OUT_DIR}\n`);
