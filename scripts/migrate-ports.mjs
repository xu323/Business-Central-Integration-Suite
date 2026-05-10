/**
 * One-shot port migration helper.
 *
 *   API:  8000 → 8365
 *   Web:  5173 → 5365
 *
 * Operates on an EXPLICIT allowlist so numeric data (e.g. seed unit_price 8000)
 * is never touched. Patterns are narrow — only URL-like / port-like contexts.
 *
 * Run from project root:
 *   node scripts/migrate-ports.mjs           # apply
 *   node scripts/migrate-ports.mjs --dry     # show counts only, no writes
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DRY_RUN = process.argv.includes("--dry");

const FILES = [
  // --- backend functional ---
  "apps/api/app/config.py",
  "apps/api/Dockerfile",
  ".env.example",
  // --- frontend functional ---
  "apps/web/vite.config.ts",
  "apps/web/package.json",
  "apps/web/scripts/screenshots.mjs",
  "apps/web/scripts/screenshots-final.mjs",
  // --- compose / scripts ---
  "docker-compose.yml",
  "docker-compose.ghcr.yml",
  "scripts/init-dev.ps1",
  "scripts/smoke-test.ps1",
  // --- docs ---
  "README.md",
  "使用方法.md",
  "apps/web/README.md",
  "docs/architecture.md",
  "docs/api.md",
  "docs/project-guide.md",
  "docs/security-notes.md",
];

const REPLACEMENTS = [
  // ---- API: 8000 → 8365 ----
  // URL-port forms only (colon-attached, no whitespace).
  [/(:)8000\b/g, "$18365"],

  // Docker compose port mapping "8000:8000" → "8365:8365"
  [/\b8000:8000\b/g, "8365:8365"],

  // env / yaml / shell forms
  [/\bAPP_PORT=8000\b/g, "APP_PORT=8365"],
  [/\bAPP_PORT:\s*8000\b/g, "APP_PORT: 8365"],

  // CLI flags
  [/--port\s+8000\b/g, "--port 8365"],
  [/--port=8000\b/g, "--port=8365"],

  // Python / TS / YAML literal port keys with explicit value
  [/\bapp_port:\s*int\s*=\s*8000\b/g, "app_port: int = 8365"],
  [/\bport:\s*8000\b/g, "port: 8365"],
  [/\bport=8000\b/g, "port=8365"],

  // Dockerfile
  [/\bEXPOSE 8000\b/g, "EXPOSE 8365"],

  // ---- WEB: 5173 → 5365 ----
  [/(:)5173\b/g, "$15365"],
  [/\b5173:80\b/g, "5365:80"],
  [/--port\s+5173\b/g, "--port 5365"],
  [/--port=5173\b/g, "--port=5365"],
  [/\bport:\s*5173\b/g, "port: 5365"],
  [/\bport=5173\b/g, "port=5365"],
  [/\bEXPOSE 5173\b/g, "EXPOSE 5365"],

  // ASCII diagram + prose forms used in docs.
  [/\(port 5173\)/g, "(port 5365)"],
  [/\(port 8000\)/g, "(port 8365)"],
];

let totalReplacements = 0;
let totalFilesChanged = 0;

for (const rel of FILES) {
  const path = resolve(rel);
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch (e) {
    process.stdout.write(`SKIP   ${rel}  (${(e && e.code) || "unknown"})\n`);
    continue;
  }
  let modified = content;
  let fileCount = 0;
  for (const [pattern, replacement] of REPLACEMENTS) {
    const before = modified;
    modified = modified.replace(pattern, replacement);
    const matches = (before.match(pattern) || []).length;
    fileCount += matches;
  }
  if (fileCount > 0) {
    totalReplacements += fileCount;
    totalFilesChanged += 1;
    if (!DRY_RUN) {
      writeFileSync(path, modified, "utf8");
    }
    process.stdout.write(`${DRY_RUN ? "DRY  " : "WRITE"}  ${rel.padEnd(48)} ${String(fileCount).padStart(3)} replacements\n`);
  } else {
    process.stdout.write(`OK    ${rel.padEnd(48)}   0 replacements\n`);
  }
}

process.stdout.write(
  `\n${DRY_RUN ? "Dry run" : "Done"}: ${totalReplacements} substitutions across ${totalFilesChanged} file(s).\n`,
);
