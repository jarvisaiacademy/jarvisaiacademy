# Production Release & Git Branching Policy

> **CRITICAL DIRECTIVE**: The `production` branch is connected to Netlify and deployed live to **`jarvisaiacademy.com`**. Direct pushes to `production` are strictly prohibited. Every modification must be developed on a dedicated branch and merged via Pull Request (PR) after verification.

---

## 1. Core Principles

1. **Two branches, two jobs**: `development` is the repository's default branch and the integration point — every task PR targets it. `production` is the deploy branch — a commit there triggers a live customer-facing deployment on Netlify, so it must stay stable, tested and deployable at all times.
2. **Zero Direct Pushes**: `git push origin production` is blocked / strictly disallowed in standard development. Same for `development`.
3. **Branch-First Development**: Every bugfix, feature, copy change, or UI refactor must be isolated in its own feature/fix branch, cut from `development`.
4. **Verified via PR**: All releases require a Pull Request. A task is done when it merges into `development`. Promoting `development` → `production` is a separate, single PR raised only when the user asks.
5. **Build minutes are metered**: `netlify.toml` skips every Netlify build context except production, so there are **no Deploy Previews and no branch deploys**. Verify UI changes locally with `pnpm dev`. Never merge to `production` just to look at a change.

---

## 2. Branch Naming Convention

Always create branches with clear, descriptive prefixes:

| Type | Prefix | Example | Description |
| :--- | :--- | :--- | :--- |
| **Feature** | `feat/` | `feat/courses-carousel` | New user-facing capability, page, or UI component. |
| **Bugfix** | `fix/` | `fix/oauth-redirect-domain` | Resolves a bug, layout glitch, or broken behavior. |
| **Refactor** | `refactor/` | `refactor/auth-provider-state` | Code cleanup without functional change. |
| **Chore / Rules** | `chore/` | `chore/enforce-branching-and-pr-workflow` | Tooling, dependencies, markdown docs, rules, CI config. |
| **Hotfix** | `hotfix/` | `hotfix/payment-webhook-timeout` | Urgent production patch; still branches off `development` and merges there first. |

---

## 3. Step-by-Step Release Workflow

### Step 1: Sync with Latest `development`
```bash
git checkout development
git pull origin development
```

### Step 2: Create a Dedicated Branch
```bash
git checkout -b feat/your-feature-name
```

### Step 3: Develop & Verify Locally
* Make your modular changes.
* **Typecheck Verification**:
  ```bash
  pnpm tsc --noEmit
  ```
  Ensure exit code is `0` with zero TypeScript errors.
* **Build Restriction**:
  > ⚠️ **NEVER RUN `pnpm build` LOCALLY** — local Next.js static builds can exhaust memory or overwrite runtime caches. Let Netlify build in its container environment.

### Step 4: Commit with Conventional Messages
```bash
git add -A
git commit -m "feat(scope): concise description of changes"
```

### Step 5: Push & PR (Only Upon Explicit User Confirmation)
> ⚠️ **DO NOT PUSH OR CREATE A PR UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
Keep changes committed locally on your feature branch. When the user asks to push or create a PR:
```bash
git push -u origin feat/your-feature-name
gh pr create --base development --title "feat(scope): title of PR" --body "Summary of changes and testing steps"
```

### Step 6: Review & Merge into `development`
* There is no Deploy Preview to inspect — build minutes are metered and previews are skipped by
  `netlify.toml`. Verify locally with `pnpm dev`, and state plainly when something was not
  verified.
* Merge into `development`. Nothing is deployed; production is untouched.
* Delete the feature branch locally and remotely after merge.

### Step 7: Promote to Production (only when the user asks)
```bash
gh pr create --base production --head development --title "release: <what shipped>" --body "..."
```
* Merging this PR is the release: Netlify builds once and publishes to **`https://jarvisaiacademy.com`**.
* Do not raise it as part of a task. Wait until the user says the work is done.

---

## 4. Agent Compliance Requirement

Any AI agent (Antigravity, Claude, Copilot, Cursor) operating in this workspace must:
1. Verify the current working branch before making any commit (`git branch --show-current`).
2. If currently on `development` or `production`, immediately checkout a new dedicated branch before making changes or commits.
3. Raise the PR against `development` when the task's changes are complete. Never target
   `production` with anything except a promotion, and only when the user asks for one.
4. Never push or merge outside the task at hand — ask first.
