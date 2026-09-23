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

## 3. Caching & Firebase Quota Rules (STRICTLY ENFORCED)
- **Public & Anonymous Surfaces**: MUST use cached endpoints (`/api/public-content` or `getPublicCourses()`) with ISR (`revalidate = 300`). NEVER attach real-time `onSnapshot` listeners to public or non-authenticated surfaces (prevents burning Firebase free tier quota).
- **Course Status Filtering**: All public components (catalogue, chat, sidebar) MUST filter out `status === "inactive"`. Inactive courses belong only in the Admin dashboard.
- **Admin Surfaces**: Admin dashboard views (`/admin`) MUST keep real-time listeners (`onSnapshot`) or direct Firestore queries so saved changes are visible immediately to operators.
- **Roster & Pagination**: Large collections (`users`, `enrollments`) MUST be queried with pagination constraints (`limit()`, `startAfter()`, `where()`). NEVER query full collections unconstrained.
- **Client Auth State & Role Caching**: Auth and role tokens (`jarvis_auth_user`, `jarvis_is_teacher`) MUST be cached in `localStorage` and guarded with `auth.authStateReady()` to prevent premature redirects to `/` on page reloads.

Refer to [`RELEASE_WORKFLOW.md`](./RELEASE_WORKFLOW.md) for the full lifecycle.
