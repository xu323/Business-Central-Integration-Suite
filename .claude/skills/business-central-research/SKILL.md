---
name: business-central-research
description: Use when a Business Central concept (AL syntax, OData API, Approval Workflow, Entra ID auth, object range) needs to be verified against Microsoft Learn before being implemented or written into docs.
---

# Business Central Research

## When to use

- A new feature is about to touch BC concepts that are not yet captured in `docs/research-notes.md`.
- An interviewer-facing answer needs a Microsoft Learn citation.
- You're unsure whether a BC API field name / endpoint shape is real.

## Workflow

1. Search `learn.microsoft.com/dynamics365/business-central/` first.
2. Cross-check the AL Language Reference (`developer/devenv-programming-in-al`) for syntax claims.
3. Append findings to `docs/research-notes.md` under the relevant section, with the URL.
4. If the finding contradicts existing implementation, file a TODO inside `docs/research-notes.md` Section 8 (Implementation Checklist) so engineers can act on it.

## Quality bar

- Every claim has a working URL.
- Distinguish "BC standard" vs "this project's simplified version" — never blur them.
- Use BC's terminology (e.g., "Vendor", "Purchase Header") rather than ad-hoc terms.

## Forbidden

- Inventing field/object names without verification.
- Citing third-party blogs as primary sources.

## Output format

A diff against `docs/research-notes.md` plus a summary message:

```
Updated docs/research-notes.md §3.2 with verified Custom API URL shape.
Source: https://learn.microsoft.com/.../devenv-develop-custom-api
```
