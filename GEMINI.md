# Mandatory Development & Release Rules

> **PERMANENT DIRECTIVE**: The `production` branch is connected to live production at **`https://jarvisaiacademy.com`** via Netlify.

## 1. Branching & PR Policy (STRICTLY ENFORCED)
- **NEVER** push directly to `production`.
- **ALWAYS** check out a separate feature / bugfix branch for all changes (e.g. `feat/...`, `fix/...`, `chore/...`, `refactor/...`), cut from `development`.
- **NEVER** run `pnpm build`. Only use `pnpm tsc --noEmit` to verify type safety.
- **ALWAYS** push to the feature branch on origin and raise a Pull Request (PR) against `development`.
- A task is finished when its PR is merged into `development`. `production` is reached only by promoting `development` in a single PR, and only when the user asks.
- Never merge a task into `production`, and never open a task PR against it.

## 2. Before Making Changes
Always check your current branch:
```bash
git branch --show-current
```
If you are on `production` or `development`, immediately branch off before committing:
```bash
git checkout -b <type>/<description>
```

Refer to [`RELEASE_WORKFLOW.md`](./RELEASE_WORKFLOW.md) for the full lifecycle.
