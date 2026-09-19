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
- **ALWAYS** verify changes with `pnpm tsc --noEmit` before raising a Pull Request.
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
- Do not rewrite unrelated files.
- Do not perform broad refactors during feature work unless required.
- Do not change package versions unnecessarily.
- Do not remove dependencies without checking their usage.
- Do not create abstractions before there is a real need.
- Do not hard-code application data into UI components when it belongs in data/state/config.
- Do not claim a task is complete without verification.
- Do not silently change product behavior.
- Do not give the admin dashboard a route or any SEO metadata — it is authenticated-only and must never be indexable.
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
per `COURSES_DATA` entry), and `/settings` (noindex). The admin dashboard has **no route** —
it renders inside `/` only for an authenticated admin — so it is already outside SEO. Keep it
that way; do not give it a URL.

The course pages are server-rendered from the same knowledge base the chat replies with
(`src/data/academy-knowledge.ts`), so the copy a crawler reads is the copy the bot says. Each
`/courses/<slug>` sets its own canonical — the root layout's `canonical: "/"` is inherited by
any route that does not override it. A new catalogue entry gets a page, a sitemap entry and an
`/llms.txt` link automatically; nothing else needs editing.

Which file owns what:

| Concern | File |
| --- | --- |
| Titles, descriptions, canonical, OG/Twitter cards, favicons | `src/app/layout.tsx` |
| Per-course title/description/canonical | `src/app/courses/[slug]/page.tsx` |
| Brand strings, contact details, social handles | `src/config/site.ts` |
| JSON-LD structured data (site + per-course) | `src/config/seo.ts` |
| Chat replies, and the page copy lifted from them | `src/data/academy-knowledge.ts` |
| Sitemap | `src/app/sitemap.ts` |
| Crawl rules | `src/app/robots.ts` |
| Web app manifest | `public/site.webmanifest` |
| `/llms.txt`, the summary AI agents read | `src/app/llms.txt/route.ts` |

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
  sitemap and the course pages are all generated from `COURSES_DATA` and `siteConfig`, so they
  track those changes on their own. Never paste the catalogue into them by hand.
- A new **reply** in `src/data/academy-knowledge.ts` → nothing to do unless it is a program's
  answer, in which case add the id to `COURSE_KB_KEY` beside it or `/courses/<id>` renders
  without its copy. `node scripts/check-course-routing.mjs` fails if the map and the chat's
  keyword router ever disagree.

Do not add `keywords` (Google ignores it). Do not add an SEO library — Next's Metadata API
plus `robots.ts` / `sitemap.ts` cover everything here.

**Trap:** do not use the `app/opengraph-image.png` / `twitter-image.png` file conventions
for the share image. They ignore `metadataBase` and emit the dev origin
(`http://localhost:3000/...`) into the built HTML, which breaks every share preview. Use
explicit absolute URLs in `openGraph.images` / `twitter.images`, as `layout.tsx` does.
