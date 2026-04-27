---
name: technical-writing
description: Use when authoring or updating README.md, 使用方法.md, docs/*.md. Especially for the absolute-beginner usage guide and the project tour.
---

# Technical Writing

## When to use

- A new feature lands and the README / 使用方法.md / project-guide.md must reflect it.
- A design claim needs to be backed by a file path.

## Workflow

1. **Draft outline** — title, audience, success criteria.
2. **Check assumptions** — write as if for someone who has never opened Business Central.
3. **Use PowerShell** — every command block uses PowerShell syntax. Show what to type and what should appear.
4. **Cite the repo** — every architectural claim cites a real file (`apps/api/app/main.py:42`).
5. **End with verification** — every "how to" ends with how the user *knows* it worked (URL, JSON snippet, screenshot description).

## Quality bar

- Beginner can follow `使用方法.md` start-to-finish without external knowledge.
- README opens with a 60-second "what this is + why it matters" hook focused on the technical scope.
- Project guide (`docs/project-guide.md`) maps every major topic (AL, BC API, audit, CI/CD, i18n, security) to a concrete file.

## Forbidden

- Marketing adjectives ("世界級", "無懈可擊").
- Pasting code that does not exist in the repo.
- Inventing performance / SLA numbers.
- Job-application / interview / resume framing — documentation is for engineers reading the code, not for selling the author.

## Output format

Markdown file written in 繁體中文 unless code/identifier requires English. Code blocks show command + expected output side-by-side.
