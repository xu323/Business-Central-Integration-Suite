---
name: al-extension-development
description: Use when adding or modifying AL objects (table, page, codeunit, enum, API page, test) inside extensions/bc-procurement/.
---

# AL Extension Development

## When to use

- A new AL object is needed (e.g., a `pageextension` for a Microsoft-shipped page).
- A status / business rule changes that needs to flow through tables / codeunits / API.
- A test codeunit needs new GIVEN/WHEN/THEN cases.

## Workflow

1. Pick the next free ID inside 50100–50199.
2. Tables: declare `DataClassification = CustomerContent;`, set `LookupPageId` if user-facing.
3. Pages: pair every `Card` with a `List`, add `UsageCategory` so search finds it.
4. API Pages: keep `APIPublisher='xu323'`, `APIGroup='integration'`, `APIVersion='v1.0'`. Add `[ServiceEnabled]` actions for state transitions.
5. Codeunits: business logic only; raise `Error()` on invalid state transitions; emit `[IntegrationEvent]` so other extensions can subscribe.
6. Tests: `Subtype = Test;`, `TestPermissions = Disabled;`, follow GIVEN / WHEN / THEN comments.
7. Verify the object compiles in a local BC Sandbox or AL-Go-Actions runner; record in PR description.

## Quality bar

- No object id collisions.
- All public procedures have an XML doc summary.
- Status transitions match the canonical state machine: Draft → Submitted → Approved | Rejected → Synced.

## Forbidden

- Mutating Microsoft-shipped tables/pages directly. Use `tableextension` / `pageextension` / event subscribers.
- Hardcoding tenant ids, secrets, or production endpoints.

## Output format

- Each new file is a complete AL source file.
- PR description references which BC concept is being mirrored, with a link to `docs/research-notes.md` section.
