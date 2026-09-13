# Production Release & Git Branching Policy

> **CRITICAL DIRECTIVE**: The `main` branch is connected to Netlify and deployed live to **`jarvisaiacademy.com`**. Direct pushes to `main` are strictly prohibited. Every modification must be developed on a dedicated branch and merged via Pull Request (PR) after verification.

---

## 1. Core Principles

1. **`main` is Production**: Every commit on `main` triggers a live customer-facing deployment on Netlify. It must remain stable, tested, and deployable at all times.
2. **Zero Direct Pushes**: `git push origin main` is blocked / strictly disallowed in standard development.
3. **Branch-First Development**: Every bugfix, feature, copy change, or UI refactor must be isolated in its own feature/fix branch.
4. **Verified via PR**: All releases require a Pull Request targeting `main`. Verification happens on the branch and via Netlify Deploy Previews before merging.

---

## 2. Branch Naming Convention

Always create branches with clear, descriptive prefixes:

| Type | Prefix | Example | Description |
| :--- | :--- | :--- | :--- |
| **Feature** | `feat/` | `feat/courses-carousel` | New user-facing capability, page, or UI component. |
| **Bugfix** | `fix/` | `fix/oauth-redirect-domain` | Resolves a bug, layout glitch, or broken behavior. |
| **Refactor** | `refactor/` | `refactor/auth-provider-state` | Code cleanup without functional change. |
| **Chore / Rules** | `chore/` | `chore/enforce-branching-and-pr-workflow` | Tooling, dependencies, markdown docs, rules, CI config. |
| **Hotfix** | `hotfix/` | `hotfix/payment-webhook-timeout` | Urgent production patch directly targeting `main`. |

---

## 3. Step-by-Step Release Workflow

### Step 1: Sync with Latest `main`
```bash
git checkout main
git pull origin main
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

### Step 5: Push Branch to Remote
```bash
git push -u origin feat/your-feature-name
```

### Step 6: Open a Pull Request (PR)
Using the GitHub CLI:
```bash
gh pr create --base main --title "feat(scope): title of PR" --body "Summary of changes and testing steps"
```
Or open the PR link provided by GitHub in your browser.

### Step 7: Review & Merge to Production
* Inspect the Netlify **Deploy Preview** URL automatically attached to the PR.
* Once accepted and merged into `main`, Netlify automatically publishes the build to **`https://jarvisaiacademy.com`**.
* Delete the feature branch locally and remotely after merge.

---

## 4. Agent Compliance Requirement

Any AI agent (Antigravity, Claude, Copilot, Cursor) operating in this workspace must:
1. Verify the current working branch before making any commit (`git branch --show-current`).
2. If currently on `main`, immediately checkout a new dedicated branch before making changes or commits.
3. Push exclusively to the feature branch and raise/provide the PR for the user.
