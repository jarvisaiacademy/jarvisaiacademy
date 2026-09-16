# Jarvis AI Academy

The academy's site and its assistant in one app. A visitor lands on a ChatGPT-style chat that
answers questions about the programmes, fees, duration and placements, and can enrol from inside
the conversation. The same answers are also published as indexable pages, so search engines can
read what the bot says.

Live at **[jarvisaiacademy.com](https://jarvisaiacademy.com)**.

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, Base UI, Lucide icons, Motion |
| Language | TypeScript, strict |
| Data | Firebase (Firestore + Auth) |
| Package manager | pnpm |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the Firebase keys
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`.env.example` lists every variable the app reads, including
`NEXT_PUBLIC_ADMIN_EMAILS` — the comma-separated accounts allowed into the admin dashboard.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build — **Netlify runs this, not you** (see below) |
| `pnpm lint` | ESLint |
| `pnpm tsc --noEmit` | Type check — the check to run before any PR |
| `pnpm seed:courses` | Writes the course catalogue in `src/data/courses.ts` to Firestore |

Do not run `pnpm build` locally; a local Next.js build can exhaust memory and overwrite runtime
caches. Netlify builds in its own container.

## Layout

```
src/
  app/            routes — / and /courses/*, plus sitemap, robots and llms.txt
  components/     chat/, layout/, admin/, and ui/ primitives
  data/           academy-knowledge.ts — the answers — and courses.ts
  providers/      auth, courses, theme
  services/       Firestore access
  config/         site.ts (brand, contact) and seo.ts (structured data)
scripts/          seeding and the course-routing guard
```

`src/data/academy-knowledge.ts` is the single source of truth for what the academy says. The chat
answers from it, and `/courses/<slug>` renders the matching entry server-side, so a page and a
reply cannot drift apart. Run `node scripts/check-course-routing.mjs` after touching either — it
fails if a programme's sidebar row and its knowledge-base entry disagree.

## Public surface

| Route | |
| --- | --- |
| `/` | The chat |
| `/courses`, `/courses/<slug>` | One page per catalogue entry, server-rendered, each with its own canonical |
| `/settings` | Account settings, `noindex` |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | Generated from the catalogue and site config |

The admin dashboard renders inside `/` for an authenticated admin only. It has no route of its
own and must never become indexable.

## Branching and release

`development` is the default branch and the only merge target for task work. `production` is
wired to Netlify and deploys live, so it moves only when someone asks for a promotion — a single
PR from `development`. Both are protected by a ruleset that blocks force pushes and deletions and
requires a pull request.

```
git checkout development && git pull
git checkout -b feat/your-change
# ... verify with pnpm tsc --noEmit ...
git push -u origin feat/your-change
gh pr create --base development
```

See [RELEASE_WORKFLOW.md](RELEASE_WORKFLOW.md) for the full policy and [CLAUDE.md](CLAUDE.md) for
the conventions this codebase holds to.
