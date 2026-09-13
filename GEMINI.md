# Mandatory Development & Release Rules

> **PERMANENT DIRECTIVE**: The `main` branch is connected to live production at **`https://jarvisaiacademy.com`** via Netlify. 

## 1. Branching & PR Policy (STRICTLY ENFORCED)
- **NEVER** push directly to `main`.
- **ALWAYS** check out a separate feature / bugfix branch for all changes (e.g. `feat/...`, `fix/...`, `chore/...`, `refactor/...`).
- **NEVER** run `pnpm build`. Only use `pnpm tsc --noEmit` to verify type safety.
- **ALWAYS** push to the feature branch on origin and raise a Pull Request (PR) against `main`.
- Production releases only occur once the PR is reviewed, accepted, and merged into `main`.

## 2. Before Making Changes
Always check your current branch:
```bash
git branch --show-current
```
If you are on `main`, immediately branch off before committing:
```bash
git checkout -b <type>/<description>
```

Refer to [`RELEASE_WORKFLOW.md`](./RELEASE_WORKFLOW.md) for the full lifecycle.
