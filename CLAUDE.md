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

### DO

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
- Remove dead code introduced by your changes.

### DO NOT

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
