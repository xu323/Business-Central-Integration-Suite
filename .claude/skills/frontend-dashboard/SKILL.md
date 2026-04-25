---
name: frontend-dashboard
description: Use when adding or modifying React pages, components, or dashboard widgets in apps/web/.
---

# Frontend Dashboard

## When to use

- A new page is needed (e.g., reports, settings).
- A component should be promoted to `src/components/` for reuse.
- The dashboard summary or visual hierarchy needs adjustment.

## Workflow

1. **Types first** — extend `src/types/index.ts` if new API shapes are involved.
2. **API surface** — add the call to `src/lib/api.ts`. Components must NOT call `fetch` directly.
3. **Component** — keep components ≤ 200 LOC; lift state up to the page level when shared.
4. **Three states** — every fetch component handles `loading` (`<Spinner />`), `error` (rose alert card), and `empty` (`<EmptyState />`).
5. **Status badges** — reuse `StatusBadge`, `SyncStatusBadge`, `HighRiskBadge`. Never duplicate colour mappings.
6. **Routing** — add the route in `src/App.tsx`. Sidebar entry goes in `src/components/Sidebar.tsx`.

## Quality bar

- `npm run typecheck` is clean.
- Tailwind classes only — no inline `style={...}` except for measured numeric values.
- Buttons/badges meet WCAG-AA contrast.

## Forbidden

- Storing tokens in `localStorage`.
- Console-logging API responses in production code.
- Importing from `..` deep paths — use the `@/` alias.

## Output format

For each change:
- Modified files with one-line description.
- A short note on visual impact (e.g., "Dashboard adds Sync Health card on the right column").
