---
name: cicd-quality
description: Use when changing GitHub Actions workflows, Dockerfiles, docker-compose, scripts/, or CI gating rules.
---

# CI/CD & Quality

## When to use

- Adding a new CI job or required check.
- Updating Dockerfiles (base images, build args).
- Adding a smoke / sanity script under `scripts/`.

## Workflow

1. **Parity** — local PowerShell scripts and CI jobs run the same commands.
2. **Pin versions** — Python 3.11, Node 20, ruff/pytest pinned in `requirements.txt` / `package.json`.
3. **Fail fast** — order jobs so cheapest fail first (lint → typecheck → unit tests → docker build).
4. **AL validation** is `continue-on-error: true` because GitHub-hosted runners lack `alc.exe`. Keep it advisory but visible.
5. **Docs check** verifies `README.md`, `使用方法.md`, `docs/*.md`, `.env.example`, `docker-compose.yml` exist.
6. **Smoke** — `scripts/smoke-test.ps1` walks the full lifecycle against a live API.

## Quality bar

- No `:latest` tags, no `--no-verify`, no skipped hooks.
- Docker images are multi-stage and slim.
- All workflows trigger on `push`, `pull_request`, and `workflow_dispatch`.

## Forbidden

- Adding self-hosted runners without explicit user approval.
- Embedding secrets in workflow YAML.

## Output format

A bullet diff of jobs added / removed, plus a one-line note on local commands that mirror them.
