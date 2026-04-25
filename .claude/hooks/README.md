# Claude Code Hooks

This folder is the recommended place for per-project hooks that run on
specific Claude Code events (PreToolUse, PostToolUse, UserPromptSubmit,
Stop, etc.). It is intentionally empty in the initial commit — hooks
should be added with explicit user approval and reviewed in PRs.

## Suggested hooks (not enabled)

| Event | Suggested hook |
|-------|---------------|
| `PreToolUse` (Edit/Write) | Run `ruff check` on touched Python files |
| `PostToolUse` (Edit/Write) | Run `tsc --noEmit` if a `.ts/.tsx` file was edited |
| `Stop` | Print the smoke-test command if `apps/api` was changed |

To enable a hook, create a `settings.json` under `.claude/` (or use the
`/update-config` skill) with the appropriate `hooks` section and a
script committed beside this README.
