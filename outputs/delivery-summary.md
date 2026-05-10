# Phase 1–5 Delivery Summary

> Two-paragraph engineering recap of the apps/web upgrade.

## What changed

The 1.5 KLOC starter front-end was rebuilt over five phases into a 39-file, 250-i18n-key, three-language enterprise console. **New runtime dependencies**: `lucide-react`, five `@radix-ui/*` packages, `sonner`, `nanoid`, `i18next` family, `@tanstack/react-table`, `react-hook-form` + `zod` + `@hookform/resolvers`, `react-number-format`, `cmdk`, `date-fns`, `recharts`, `xlsx`, `jspdf` + `jspdf-autotable`. Net 19 changed source files, 18 newly added components (Avatar, UserMenu, NotificationBell, OrgSwitcher, CommandPalette, Breadcrumb, DensityToggle, Combobox, ApprovalTimeline, three chart widgets, two lookup dialogs, sample-data, AlertDialog, three Skeleton variants, ErrorBoundary, NotFoundPage), and seven shared `lib/` helpers (`cn`, `density`, `format`, `notify`, `recent`, `export`, plus the existing `api`). All five pages were rewritten end-to-end. The Tailwind palette was retokenised to Microsoft Fluent 2 (Microsoft Blue `#0078D4`, neutral 10–190, success/warning/danger/info), the font stack switched to Segoe UI Variable, container radii dropped to 4 px, and Fluent depth-4 / depth-16 / depth-64 shadow tokens were introduced.

## Quality outcomes

`tsc --noEmit` and ESLint both run clean. Ripgrep confirms zero emoji, zero `demo.user / Acme / V0001 / "manager"` hardcoded values, zero `confirm/alert/prompt`, zero `console.*` in `src/`. Production-build Lighthouse desktop scores climbed from a baseline-of-record dev score of **54 / 95 / 100 / 82** to **Performance 99 / Accessibility 95 / Best Practices 96 / SEO 63** — the SEO drop is an intentional `noindex` + `Disallow: /` for an internal portal, documented in [`outputs/acceptance.md`](acceptance.md). Phase 4 also code-split the bundle into `vendor-react / -radix / -i18n / -table / -charts / -export` chunks, with `vendor-export` (jspdf + xlsx) only fetched when the user clicks Export. Visual proof: 30 final PNGs in [`outputs/screenshots/final/`](screenshots/final/) covering 10 pages × `zh-TW / en / ja`, plus 18 phase-checkpoint shots from Phase 2–4.
