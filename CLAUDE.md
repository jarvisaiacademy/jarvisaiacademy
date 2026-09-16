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

> **CRITICAL PRODUCTION SAFEGUARD**: The `main` branch is connected to live production at **`https://jarvisaiacademy.com`** via Netlify. **NEVER** push directly to `main`. Every change must be in a separate branch and merged via a Pull Request (PR) after verification.

### DO

- **ALWAYS** check out a separate branch (`feat/...`, `fix/...`, `chore/...`) before making changes or commits.
- **ALWAYS** verify changes with `pnpm tsc --noEmit` before raising a Pull Request.
- **ALWAYS** push to the feature branch and raise a Pull Request (PR) against `main`.
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

- **Do not push directly to `main` under any circumstances** (all changes must be on feature branches and merged via PR).
- **Do not run `pnpm build` locally** (use `pnpm tsc --noEmit` only; Netlify performs the production build).
- Do not replace the project's framework or stack without explicit approval.
- Do not migrate libraries simply because another library is fashionable.
- Do not introduce Redux unless explicitly requested.
- Do not introduce another CSS framework.
- Do not introduce another UI component library without explicit approval.
- Do not mix multiple primitive ecosystems unnecessarily.
- Do not create duplicate components when an existing component can be extended.
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

The public surface is two routes: `/` (indexable) and `/settings` (noindex). The admin
dashboard has **no route** — it renders inside `/` only for an authenticated admin — so it
is already outside SEO. Keep it that way; do not give it a URL.

Which file owns what:

| Concern | File |
| --- | --- |
| Titles, descriptions, canonical, OG/Twitter cards, favicons | `src/app/layout.tsx` |
| Brand strings, contact details, social handles | `src/config/site.ts` |
| JSON-LD structured data | `src/config/seo.ts` |
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
- Course catalogue, fees, duration or contact details → nothing to do. `/llms.txt` is
  generated from `COURSES_DATA` and `siteConfig`, so it tracks those changes on its own.
  Never paste the catalogue into it by hand.

Do not add `keywords` (Google ignores it). Do not add an SEO library — Next's Metadata API
plus `robots.ts` / `sitemap.ts` cover everything here.

**Trap:** do not use the `app/opengraph-image.png` / `twitter-image.png` file conventions
for the share image. They ignore `metadataBase` and emit the dev origin
(`http://localhost:3000/...`) into the built HTML, which breaks every share preview. Use
explicit absolute URLs in `openGraph.images` / `twitter.images`, as `layout.tsx` does.
