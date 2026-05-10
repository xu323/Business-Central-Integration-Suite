# Business Central Integration Suite — Web Dashboard

React + TypeScript + Vite + Tailwind. Microsoft Fluent 2 / Dynamics 365 BC visual language. zh-TW / en / ja.

## Quick start

```powershell
# install
cd apps/web
npm install

# develop (proxies /api → http://localhost:8000 by default)
npm run dev

# typecheck + lint
npm run typecheck
npm run lint

# production build + preview
npm run build
npm run preview

# screenshots (requires API + dev server running on default ports)
node scripts/screenshots.mjs phase4         # 8 mixed-language PNGs
node scripts/screenshots-final.mjs          # 30 PNGs (10 pages × 3 langs)
```

## Design system

### Colour tokens (`tailwind.config.js`)

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-50…900` | `#EFF6FC … #002F5A` | Microsoft Blue ramp; `brand-500 = #0078D4` is primary |
| `neutral-10…190` | `#FAF9F8 … #201F1E` | Fluent 2 neutral ramp (text, surface, border) |
| `success` | `#107C10` + `bg #DFF6DD` + `border #9FD89F` | Approved / synced |
| `warning` | `#797673` + `bg #FFF4CE` + `border #F2CD81` | Submitted / pending |
| `danger`  | `#A4262C` + `bg #FDE7E9` + `border #F1BBBC` | Rejected / errors / high-risk |
| `info`    | `#0078D4` + `bg #DEECF9` + `border #A0D0F5` | Sync / informational |

### Typography

System font stack (Windows 11 picks Segoe UI Variable natively):

```
Segoe UI Variable Display, Segoe UI Variable, Segoe UI,
Microsoft JhengHei UI, Microsoft JhengHei, Yu Gothic UI,
system-ui, sans-serif
```

Mono: `Cascadia Code, Cascadia Mono, Consolas, monospace`.

### Radii / shadows

- All container radii are 4px (`rounded`); pills use `rounded-full`.
- `shadow-card` (depth 4): `0 1.6px 3.6px / 0 0.3px 0.9px`
- `shadow-flyout` (depth 16): `0 6.4px 14.4px / 0 1.2px 3.6px` — Popover, Dropdown, Dialog
- `shadow-modal` (depth 64) reserved for full-screen modals
- Focus stealth ring: `2px brand-500 outline + 2px white offset` for buttons; inputs use a 1px inline brand ring instead

### Density

`useDensity()` (`@/lib/density`) reads `localStorage["bcsuite.density"]` and returns one of:

| Value | Row height |
|-------|-----------|
| `compact` | 28px |
| `standard` | 36px (default) |
| `comfortable` | 44px |

Toggled via [`<DensityToggle />`](src/components/DensityToggle.tsx) in every `DataTableToolbar`.

### Icons

Single source: [`lucide-react`](https://lucide.dev). Sizes:

| Context | Size | Stroke |
|---------|------|--------|
| Inline (in a sentence) | 12 / 14 | 1.75 |
| Buttons / nav items | 14 / 16 / 18 | 1.75 |
| Page headers / hero | 20 / 22 | 1.5 |

Status indicators: tiny 1.5px coloured dot + text, never an icon-only badge.

## Component map

```
src/
├── App.tsx                           # routes
├── main.tsx                          # ErrorBoundary + Toaster + i18n bootstrap
├── styles.css                        # Fluent tokens, button system
├── styles/print.css                  # @media print
│
├── auth/
│   └── useCurrentUser.ts             # mock identity (MSAL-ready shape)
│
├── i18n/
│   ├── index.ts                      # i18next + LanguageDetector
│   └── locales/{zh-TW,en,ja}.json    # ~250 translation keys × 3
│
├── lib/
│   ├── api.ts                        # backend client (only entry point)
│   ├── cn.ts                         # clsx wrapper
│   ├── density.ts                    # row-height preference
│   ├── export.ts                     # CSV / XLSX / PDF (xlsx + jspdf-autotable)
│   ├── format.ts                     # date-fns + Intl, locale-aware
│   ├── notify.ts                     # sonner toast helpers
│   └── recent.ts                     # recently-viewed (localStorage)
│
├── components/
│   ├── data-table/
│   │   ├── DataTable.tsx             # TanStack-table core (sort/page/select/visibility)
│   │   └── DataTableToolbar.tsx      # search + filters + density + columns + export + print
│   ├── lookup/
│   │   ├── VendorLookupDialog.tsx    # Radix Dialog + 12 sample TW/JP vendors
│   │   ├── ItemLookupDialog.tsx
│   │   └── sample-data.ts            # → // TODO: backend endpoint
│   ├── charts/
│   │   ├── Sparkline.tsx
│   │   ├── TrendChart.tsx            # dual-axis count + amount
│   │   └── DepartmentBar.tsx
│   ├── ui/
│   │   ├── AlertDialog.tsx           # destructive flow with type-to-confirm
│   │   └── Skeleton.tsx              # Dashboard / Table / Detail variants
│   ├── ApprovalTimeline.tsx
│   ├── Avatar.tsx
│   ├── Breadcrumb.tsx
│   ├── CommandPalette.tsx            # Cmd/Ctrl+K
│   ├── Combobox.tsx                  # Radix Popover + cmdk
│   ├── DensityToggle.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx             # nanoid ticket id, copy diagnostics
│   ├── Layout.tsx
│   ├── LanguageSwitcher.tsx
│   ├── NotificationBell.tsx
│   ├── OrgSwitcher.tsx
│   ├── Sidebar.tsx
│   ├── Spinner.tsx
│   ├── StatusBadge.tsx               # dot + text (Fluent semantic)
│   ├── Topbar.tsx
│   └── UserMenu.tsx
│
└── pages/
    ├── DashboardPage.tsx             # 4 stat sparklines + 30-day trend + dept bar + high-risk list
    ├── RequestListPage.tsx           # DataTable + advanced filters + bulk select + exports
    ├── CreateRequestPage.tsx         # react-hook-form + zod + lookup + auto-save
    ├── RequestDetailPage.tsx         # ApprovalTimeline + copy-as-new + PDF download
    ├── AuditLogPage.tsx              # DataTable + date/actor/action filters
    └── NotFoundPage.tsx              # 404
```

## Key dependencies

| Group | Packages |
|-------|----------|
| Runtime | `react`, `react-dom`, `react-router-dom` |
| State / forms | `react-hook-form`, `@hookform/resolvers`, `zod`, `react-number-format` |
| Tables | `@tanstack/react-table` |
| UI primitives | `@radix-ui/react-{alert-dialog,dialog,dropdown-menu,popover,tooltip}`, `cmdk`, `sonner`, `lucide-react`, `clsx` |
| Charts | `recharts` |
| Export / print | `xlsx`, `jspdf`, `jspdf-autotable` |
| i18n | `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `date-fns` |
| Misc | `nanoid` |
| Dev | `vite`, `@vitejs/plugin-react`, `tailwindcss`, `typescript`, `eslint`, `playwright` |

## i18n

- Three locales: `zh-TW` (default fallback), `en`, `ja`
- Detection order: `localStorage["bcsuite.lang"]` → `navigator.language` → `<html lang>`
- Adding a new key: add to all three JSONs (`src/i18n/locales/*.json`); structure follows page → section → key
- Adding a fourth language: copy `en.json`, register in `src/i18n/index.ts` `SUPPORTED_LANGUAGES` + `LANGUAGE_LABELS`, append a `shortLabel` entry inside each existing locale

## Build / Lighthouse

Production preview (Lighthouse desktop, `npm run build && npm run preview`):

| Category | Score |
|----------|-------|
| Performance | **99** |
| Accessibility | **95** |
| Best Practices | **96** |
| SEO | **63** (intentional — see below) |

The SEO score is deliberately depressed by `<meta name="robots" content="noindex">` and `public/robots.txt`'s `Disallow: /`. This is correct for an internal enterprise portal that should not appear in public search engines.

Code-splitting (`vite.config.ts`) groups vendor chunks: `vendor-react`, `vendor-radix`, `vendor-i18n`, `vendor-table`, `vendor-charts`, `vendor-export` (the last is only loaded when the user clicks Export).

## Screenshots

| Phase | Folder | Count | Notes |
|-------|--------|-------|-------|
| Phase 2 | [`outputs/screenshots/phase2/`](../../outputs/screenshots/phase2/) | 5 | Drop emoji + add Topbar |
| Phase 3 | [`outputs/screenshots/phase3/`](../../outputs/screenshots/phase3/) | 5 | Fluent 2 / Microsoft Blue alignment |
| Phase 4 | [`outputs/screenshots/phase4/`](../../outputs/screenshots/phase4/) | 8 | DataTable + RHF + lookup dialog |
| **Final** | [`outputs/screenshots/final/`](../../outputs/screenshots/final/) | **30** | 10 pages × {zh-TW, en, ja} |

## Conventions

1. **Pages never call `fetch` directly** — use `@/lib/api`.
2. **Three states for every data fetch** — `<Spinner />` (or `<DataTable loading />`), `<EmptyState />`, error → `notify.error(...)`.
3. **Shared status palette** — only `StatusBadge / SyncStatusBadge / HighRiskBadge` know status colours. Never reproduce the colour map.
4. **No `confirm()` / `alert()` / `prompt()`** — destructive flows go through [`<AlertDialog />`](src/components/ui/AlertDialog.tsx); informational messages go to `notify`.
5. **No emoji in source files** — icons must come from `lucide-react`. The single exception is the `app.footer` MSP-demo label.
6. **Identity must come from `useCurrentUser()`** — no hard-coded actor / department / vendor strings (legitimate i18n role *labels* like `承認者 / Approver` are allowed; values are not).
