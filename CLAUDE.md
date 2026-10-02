# CLAUDE.md

## Project Identity

This project is a ChatGPT-inspired AI chat application with a highly polished,
minimal, dark-first interface.

The primary goal is:

1. Build a production-quality AI chat application.
2. Recreate the visual quality and interaction quality of modern AI products.
3. Maintain a clean, scalable architecture.
4. Keep the implementation understandable and maintainable.
5. Avoid unnecessary dependencies and abstractions.
6. Never sacrifice architecture or usability merely to imitate a screenshot.

This is a real application, not a static UI mockup.

---

# 1. Non-Negotiable Rules

These rules take priority over convenience.

### Response style

- Keep Ponytail full mode active for this workspace: YAGNI, reuse existing solutions, prefer stdlib/native features, and make the smallest correct change.
- Keep the `i-have-adhd` response rules active: lead with the answer or next action, number multi-step work, state progress clearly, avoid tangents and preambles, and end without a recap or pleasantry.
- These preferences remain active unless the user explicitly turns them off.

> **CRITICAL PRODUCTION SAFEGUARD**: The `production` branch is connected to live production at **`https://jarvisaiacademy.com`** via Netlify. **NEVER** push directly to `production`. Every change must be in a separate branch and merged via a Pull Request (PR) after verification.

> **TWO-BRANCH MODEL — `development` integrates, `production` deploys.**
> `development` is the repository's **default branch**, so it is the base for every task PR.
> Task branches cut from `development`, merge back into `development`, and that is the end of
> the task. `production` moves only by promoting `development` in a single PR, and only when
> the user asks for it — that merge is the release.
> Every Netlify build spends the user's metered monthly minutes, and `netlify.toml` skips every
> context except production. So do not merge a task into `production` to "see it live": it costs
> a build, and nothing is verifiable on a preview URL — verify locally with `pnpm dev`.

### DO

- **ALWAYS** check out a separate branch (`feat/...`, `fix/...`, `chore/...`) before making changes or commits.
- **ALWAYS** verify changes with `pnpm check` — `tsc --noEmit` plus `eslint --quiet .` — before committing or raising a Pull Request. It is the same command the `pre-commit` and `pre-push` hooks in `.githooks/` run, so a commit that would fail it does not get made. Warnings do not fail it; errors do. The hooks live in the repository rather than `.git/hooks/`, which means git has to be told to look there: `git config core.hooksPath .githooks`, which the `prepare` script in `package.json` runs on every `pnpm install`. Do not add a hook runner dependency — this is the whole mechanism.
- **ALWAYS** push to the feature branch and raise a Pull Request (PR) against `development`.
- **ALWAYS** cut task branches from `development`, and promote with `--base production`. Keep the promotion fast-forwardable — no rebasing `production`.
- Inspect the existing code before modifying it.
- Reuse existing components and utilities when appropriate.
- Follow the existing project architecture.
- Keep changes focused on the requested task.
- Prefer simple, composable solutions.
- Use TypeScript strictly.
- Use shadcn/ui primitives for standard UI components.
- Use Tailwind CSS for styling.
- Use Lucide icons instead of manually drawn SVG icons when an equivalent exists.
- Use Motion for meaningful UI animation and micro-interactions.
- Validate user input with Zod where appropriate.
- Run relevant tests, type checks, linting, and builds after meaningful changes.
- Preserve accessibility.
- Preserve responsive behavior.
- Check both desktop and mobile layouts when changing UI.
- **ALWAYS** update SEO whenever public-facing content changes — see [§3 SEO](#3-seo).
- Remove dead code introduced by your changes.

### DO NOT

- **Do not push directly to `production` under any circumstances** (all changes must be on feature branches and merged via PR).
- **Do not raise a task PR against `production` or merge one into it.** `production` moves only when the user asks for a promotion from `development`.
- Do not rename or delete the `development` or `production` branches, or change the repository's default branch, without being asked — Netlify resolves its production branch by name. These two are the only long-lived branches; `main` no longer exists.
- **Do not run `pnpm build` locally** (use `pnpm tsc --noEmit` only; Netlify performs the production build).
- Do not replace the project's framework or stack without explicit approval.
- Do not migrate libraries simply because another library is fashionable.
- Do not introduce Redux unless explicitly requested.
- Do not introduce another CSS framework.
- Do not introduce another UI component library without explicit approval.
- Do not mix multiple primitive ecosystems unnecessarily.
- Do not create duplicate components when an existing component can be extended.
- **Do not render a control whose chrome the browser draws itself** — `<select>`/`<option>`, `<datalist>`, or a native checkbox, radio, date/time/colour picker, range slider, file input or dialog. That chrome cannot be themed, so it arrives in the OS's own colours and breaks the interface. Use the matching primitive in `src/components/ui/` (the dropdown is `src/components/ui/select.tsx`), or wrap the equivalent `@base-ui/react` component the way that file does. A Tailwind-styled `<input>`, `<textarea>` or `<button>` is fine — the offence is the platform's rendering, not the tag.
- **Do not let a dropdown open over its own field, and do not re-place a popup per call site.** Every dropdown in the app is one of two primitives in `src/components/ui/`: `select.tsx` for a closed list of choices, `combobox.tsx` for a field that takes free text with suggestions. Both open *under* the field their own `sideOffset` away, and the primitive owns that, so a new dropdown-looking field uses one of them rather than a fresh `@base-ui/react` wrapper — one fix then keeps every dropdown in step. The trap is Base UI's own default: `Select.Positioner` ships `alignItemWithTrigger` as `true`, which slides the list until the selected item sits over the trigger — the native macOS menu, which reads as a misplaced popup beside every field that does not do it. `select.tsx` passes `false`; leave it that way.
- Do not rewrite unrelated files.
- Do not perform broad refactors during feature work unless required.
- Do not change package versions unnecessarily.
- Do not remove dependencies without checking their usage.
- Do not create abstractions before there is a real need.
- Do not hard-code application data into UI components when it belongs in data/state/config.
- Do not claim a task is complete without verification.
- Do not silently change product behavior.
- **Do not render the admin dashboard anywhere but `/admin`**, and give it no SEO beyond the `robots: { index: false }` its layout already exports. It is authenticated-only, must never be indexable, and stays out of the sitemap and `/llms.txt`. The route's gate is client-side UX; `firestore.rules` is the real access control.
- Do not invent APIs, backend behavior, environment variables, or database schemas.

---

# 2. Technology Stack

## Core

- Next.js 16
- React 19
- TypeScript
- App Router
- pnpm

## Styling

- Tailwind CSS v4
- shadcn/ui
- CSS variables for design tokens

## UI

- Lucide React
- shadcn/ui

---

# 3. SEO

The public surface is: `/` (indexable), `/courses` and `/courses/<slug>` (indexable, one
per `COURSES_DATA` entry). The non-public routes are `/settings` (account UI) and `/admin`
(the dashboard). Both are **noindex and authenticated-only**: each exports
`robots: { index: false }` from its own server-component `layout.tsx` and its own canonical,
and both are deliberately absent from the sitemap and `/llms.txt`.

`/admin` keeps its URL so that refreshing the dashboard refreshes the dashboard. That is not
cosmetic: `/` is statically prerendered, so restoring the dashboard *after* hydration always
flashes the chat page first. Nothing admin-only is ever in the HTML — the route reveals its
content one commit after mount, once localStorage says the visitor is an admin — so the gate
is UX, and `firestore.rules` remains the real access control.

The course pages are server-rendered from the same knowledge base the chat replies with
(`src/data/academy-knowledge.ts`), so the copy a crawler reads is the copy the bot says. The
catalogue itself is read from Firestore through `getPublicCourses()`, so `/courses`,
`/courses/<slug>`, `src/app/sitemap.ts` and `/llms.txt` all set `revalidate = 300` and pick up
an admin edit within five minutes, with no deploy. Each `/courses/<slug>` sets its own
canonical — the root layout's `canonical: "/"` is inherited by any route that does not
override it. A new catalogue entry gets a page, a sitemap entry and an `/llms.txt` link
automatically; nothing else needs editing.

Which file owns what:

| Concern | File |
| --- | --- |
| Titles, descriptions, canonical, OG/Twitter cards, favicons | `src/app/layout.tsx` |
| Per-course title/description/canonical | `src/app/courses/[slug]/page.tsx` |
| Brand strings, contact details, social handles | `src/config/site.ts` |
| JSON-LD structured data (site + per-course) | `src/config/seo.ts` |
| Chat replies, and the page copy lifted from them | `src/data/academy-knowledge.ts` |
| The catalogue those pages read | `src/lib/courses-server.ts`, falling back to `src/data/courses.ts` |
| Sitemap | `src/app/sitemap.ts` |
| Crawl rules | `src/app/robots.ts` |
| Web app manifest | `public/site.webmanifest` |
| `/llms.txt`, the summary AI agents read | `src/app/llms.txt/route.ts` |
| Requested wording changes to hard-coded copy | edit the file directly — there is no in-app request queue |

**When public-facing content changes, update the matching SEO value in the same commit:**

- Brand wording or tagline → `siteConfig.tagline` **and** the `description` in
  `public/site.webmanifest` (they have drifted before).
- Value proposition, programs, fees, city, phone → `siteConfig.description` and
  `structuredData`.
- New public route → add it to `src/app/sitemap.ts`.
- New non-public route (account, admin) → export `robots: { index: false }` from a
  server-component `layout.tsx` in that segment. A `"use client"` page **cannot** export
  metadata — that is why `src/app/settings/layout.tsx` exists. Never use a `Disallow`
  for this: it stops the crawl before the `noindex` can be read.
- New social profile → `siteConfig.links`, which feeds both the sidebar and `sameAs`.
- Course catalogue, fees, duration or contact details → nothing to do. `/llms.txt`, the
  sitemap and the course pages all read Firestore through `getPublicCourses()`
  (`src/lib/courses-server.ts`), falling back to `COURSES_DATA` and `siteConfig` when the
  collection is empty or unreachable, so they track those changes on their own. Never paste
  the catalogue into them by hand. Edits arrive through the admin dashboard, or through
  `pnpm seed:content`, which uploads `src/data/courses.ts` and is the only thing that puts
  them into Firestore in the first place. The academy's own figures — referral reward, Super10
  seat cap, GST rate, GSTIN, money-back window — are **not** in Firestore: they are hard-coded
  in `src/data/app-settings.ts`, with no editor in the dashboard.
- A new **reply** in `src/data/academy-knowledge.ts` → nothing to do unless it is a program's
  answer, in which case add the id to `COURSE_KB_KEY` beside it or `/courses/<id>` renders
  without its copy. `node scripts/check-course-routing.mjs` fails if the map and the chat's
  keyword router ever disagree.

**Copy the dashboard cannot edit.** The replies, the alumni pool in `src/data/testimonials.ts`
and the `/llms.txt` prose are hard-coded in `src/`. The app never edits its own codebase, so a
wording change is a code change and ships with a deploy. If the change names a programme's
reply it lands on `/courses/<id>` too, so it carries the SEO pass above.

Do not add `keywords` (Google ignores it). Do not add an SEO library — Next's Metadata API
plus `robots.ts` / `sitemap.ts` cover everything here.

**Trap:** do not use the `app/opengraph-image.png` / `twitter-image.png` file conventions
for the share image. They ignore `metadataBase` and emit the dev origin
(`http://localhost:3000/...`) into the built HTML, which breaks every share preview. Use
explicit absolute URLs in `openGraph.images` / `twitter.images`, as `layout.tsx` does.
