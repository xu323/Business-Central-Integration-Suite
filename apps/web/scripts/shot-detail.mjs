/**
 * One-off detail screenshot for verifying ApprovalTimeline layout.
 * Run: node scripts/shot-detail.mjs <request-id>
 */
import { chromium } from "playwright";
import { resolve } from "node:path";

const id = process.argv[2];
if (!id) throw new Error("usage: node shot-detail.mjs <request-id>");

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  locale: "zh-TW",
  timezoneId: "Asia/Taipei",
  deviceScaleFactor: 2,
});
await ctx.addInitScript(() => {
  window.localStorage.setItem("bcsuite.lang", "zh-TW");
  window.localStorage.setItem("bcsuite.density", "standard");
});

const page = await ctx.newPage();
await page.goto(`http://localhost:5365/requests/${id}`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

const out = resolve("..", "..", "outputs", "screenshots", "timeline-fix.png");
await page.screenshot({ path: out, fullPage: true });
process.stdout.write(`saved ${out}\n`);
await ctx.close();
await browser.close();
