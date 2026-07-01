<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Nikart Modern — Agent Guidelines

## Project Overview

Portfolio site migration from legacy Flash/Backbone to Next.js 16. Faithful reproduction of existing design and interactions.

## Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **Styling:** Tailwind CSS 4
- **Animation:** GSAP 3 via `@gsap/react` (`useGSAP` hook with `gsap.context()` cleanup)
- **State:** Zustand (UI state); URL-driven navigation state
- **i18n:** next-intl (locales: en, es)
- **Testing:** Vitest + React Testing Library (unit); Playwright (E2E)
- **Deployment:** Vercel

## Commands

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run
npm run test:e2e     # Playwright E2E
```

## Code Conventions

1. **TypeScript strict** — No `any`, no implicit returns, strict null checks, `noUncheckedIndexedAccess`.
2. **One component per file** — Named exports matching filename.
3. **Colocation** — Component, styles, tests, and types in the same directory.
4. **Explicit props** — All component props defined as named interfaces (not inline).
5. **GSAP pattern** — All animations use `useGSAP()` with scope ref. Cleanup is automatic.
6. **Zustand slices** — Each store slice in its own file under `src/store/`.
7. **URL-driven state** — Navigation state lives in the URL via next-intl routing.

## Directory Structure

```
src/
├── app/                  # Next.js App Router
│   ├── [locale]/         # Locale-scoped routes
│   │   ├── layout.tsx    # Locale provider
│   │   └── page.tsx      # Home page
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout (fonts, html)
├── components/           # Shared UI components
├── lib/                  # Utilities (gsap setup, etc.)
├── store/                # Zustand stores
├── i18n/                 # next-intl config
├── messages/             # Translation JSON files
├── middleware.ts         # next-intl middleware
├── navigation.ts         # Typed navigation helpers
├── routing.ts            # Locale routing config
└── test/                 # Test setup
```

## Testing Requirements

- Every component gets a colocated `*.test.tsx` file.
- Data utilities must have >90% coverage.
- E2E tests cover: nav open → select item → view content → change language.

## Rules

- Do NOT add features beyond what's specified in the migration plan.
- Do NOT redesign — faithfully reproduce the legacy visual design.
- Keep bundle size minimal — dynamic imports for heavy components.
- Comments only for "why", not "what".
