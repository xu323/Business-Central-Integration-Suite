/**
 * One-shot Tailwind palette migration for Phase 3.
 * Maps slate-* → neutral-*, amber/emerald/rose → success/warning/danger,
 * and tightens any leftover rounded-md / rounded-lg / rounded-xl to rounded.
 *
 * Run:  cd apps/web && node scripts/recolor.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { glob } from "node:fs/promises";

// Slate (Tailwind default) → Fluent neutral.
const SLATE_TO_NEUTRAL = [
  ["slate-50",  "neutral-10"],
  ["slate-100", "neutral-20"],
  ["slate-200", "neutral-40"],
  ["slate-300", "neutral-60"],
  ["slate-400", "neutral-90"],
  ["slate-500", "neutral-130"],
  ["slate-600", "neutral-130"],
  ["slate-700", "neutral-160"],
  ["slate-800", "neutral-190"],
  ["slate-900", "neutral-190"],
];

// Tailwind semantic → Fluent semantic tokens.
const SEMANTIC_MAP = [
  // Background pairs.
  ["amber-100",   "warning-bg"],
  ["emerald-100", "success-bg"],
  ["rose-100",    "danger-bg"],
  ["rose-50",     "danger-bg"],
  ["amber-50",    "warning-bg"],
  ["emerald-50",  "success-bg"],
  // Foreground / borders.
  ["amber-800",   "warning"],
  ["amber-500",   "warning"],
  ["emerald-800", "success"],
  ["emerald-700", "success"],
  ["emerald-600", "success"],
  ["emerald-500", "success"],
  ["rose-800",    "danger"],
  ["rose-700",    "danger"],
  ["rose-600",    "danger"],
  ["rose-500",    "danger"],
  ["rose-400",    "danger"],
  ["rose-200",    "danger-border"],
];

// Container radii: pin to default `rounded` (4px = Fluent).
const RADIUS_MAP = [
  ["rounded-md", "rounded"],
  ["rounded-lg", "rounded"],
  ["rounded-xl", "rounded"],
];

const SUBS = [...SLATE_TO_NEUTRAL, ...SEMANTIC_MAP, ...RADIUS_MAP];

async function* walk() {
  for await (const entry of glob("src/**/*.{ts,tsx,css}")) {
    yield entry;
  }
}

let changed = 0;
let totalReplacements = 0;

for await (const file of walk()) {
  const before = await readFile(file, "utf8");
  let after = before;
  let replacements = 0;
  for (const [from, to] of SUBS) {
    // Match the token preceded by a non-word boundary (e.g. `bg-`, `text-`,
    // `border-`, `hover:bg-`) to avoid partial matches.
    const re = new RegExp(`\\b${from}\\b`, "g");
    const matches = (after.match(re) || []).length;
    if (matches) {
      after = after.replace(re, to);
      replacements += matches;
    }
  }
  if (replacements) {
    await writeFile(file, after, "utf8");
    changed += 1;
    totalReplacements += replacements;
    process.stdout.write(`  ${file}: ${replacements} replacements\n`);
  }
}

process.stdout.write(`\nDone. ${changed} files changed, ${totalReplacements} replacements total.\n`);
