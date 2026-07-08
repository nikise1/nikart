# Progress

**Project:** nikart portfolio migration (Legacy → Next.js 16)
**Started:** 2026-06-24

---

## Completed Steps

### Step 1: Legacy App Audit ✅

- Analysed codebase structure, routes, data flow, state management
- Inventoried all animations (GSAP, CSS, Canvas)
- Identified tech debt and migration complexity
- **Deliverables:**
  - [LEGACY_ANALYSIS_FACTS.md](LEGACY_ANALYSIS_FACTS.md)
  - [LEGACY_ANALYSIS_OPINIONS.md](LEGACY_ANALYSIS_OPINIONS.md)

### Step 2: Research ✅

- Evaluated frameworks, animation libraries, state management, testing, deployment, i18n, styling
- Assessed agent maintainability for each choice
- **Deliverable:**
  - [STACK_DECISION.md](STACK_DECISION.md)

### Step 3: Plan & Progress ✅

- Defined 7 migration phases with effort estimates (~10–12 sessions total)
- Established agent maintainability requirements (code conventions, testing, CI/CD)
- **Deliverables:**
  - [MIGRATION_PLAN.md](MIGRATION_PLAN.md)
  - [PROGRESS.md](PROGRESS.md) (this file)

---

## Current Step

### Step 4: Project Setup & Architecture ✅ (2026-06-29)

- [x] Init Next.js 16 in `modern/` (App Router, React 19, Turbopack)
- [x] Configure TypeScript strict mode (`noUncheckedIndexedAccess`, `noUnusedLocals`, `exactOptionalPropertyTypes`)
- [x] Tailwind CSS 4, ESLint
- [x] Set up Vitest + React Testing Library + jsdom
- [x] Set up Playwright (Chromium, E2E config)
- [x] Install & configure next-intl (`/en/...`, `/es/...` routing, middleware, messages)
- [x] Install GSAP 3 + `@gsap/react` (useGSAP hook wrapper in `src/lib/gsap.ts`)
- [x] Set up Zustand store (`src/store/ui-store.ts` — nav open/close)
- [x] Create AGENTS.md with full code conventions
- [x] Configure Vercel deployment (`vercel.json`)
- [x] Build passes cleanly

---

### Step 5: Data Layer & Content Types ✅ (2026-07-01)

- [x] Typed JSON data model — Zod schemas + TS types (`LocalizedString`, `ContentItem`, `MenuItem`, `SiteData`)
- [x] Validated import of `data.json` via `DataSchema.parse()` at build time
- [x] Content access utilities: `localize()`, `localizeUrl()`, `findByPath()`, `findById()`, `getPathTo()`, `getBreadcrumbs()`, `getContentItems()`, `getSubMenus()`, `getTopMenu()`
- [x] 25 unit tests passing (schema validation + all utilities)
- [x] Copied `data-pretty.json` into `modern/public/content/json/`

---

### Step 6: Layout & Navigation Shell ✅ (2026-07-01)

- [x] App layout — responsive shell with fixed nav, header (breadcrumbs + lang switcher), content area
- [x] Route structure — `[locale]/[...path]` catch-all resolving against JSON tree
- [x] Nav component — Zustand-driven open/close, GSAP staggered item animation with curved margin-left
- [x] Nav canvas bezier shape — ported exact legacy bezier coordinates, GSAP slide in/out
- [x] Breadcrumbs component — path-derived, locale-aware titles, linked
- [x] Language switcher — en↔es toggle preserving current path
- [x] ContentPage placeholder (menu vs leaf rendering)
- [x] Build clean, 25 tests passing

---

## Next Step

### Step 7: Content Views ✅ (2026-07-02)

- [x] Thumbnail grid view (`src/components/thumbnail/thumbnail-grid.tsx`)
- [x] Thumbnail item component (`src/components/thumbnail/thumbnail-item.tsx`) — GSAP stagger entrance
- [x] Article view (`src/components/article/article-view.tsx`) — text/web/image with slideshow
- [x] Video view (`src/components/video/video-view.tsx`) — native `<video>` with H.264/WebM
- [x] Menu/category landing view (`src/components/menu-landing/menu-landing.tsx`) — sub-menu links
- [x] Asset URL utilities (`src/lib/assets.ts`) + 8 unit tests
- [x] ContentPage refactored to dispatch to correct view by item type
- [x] Build clean, lint clean, 33 tests passing

---

### Step 8: Animation & Transitions ✅ (2026-07-02)

- [x] ScrollTrigger for thumbnail items — viewport-based stagger entrance with reverse on scroll out
- [x] GSAP cross-fade slideshow — stacked images with `autoAlpha` transitions, auto-advance timer
- [x] View Transitions API — `experimental.viewTransition` enabled in next.config.ts
- [x] Directional route animations — `nav-forward` (slide left) / `nav-back` (slide right) / `crossfade` (default)
- [x] `transitionTypes` on Links — thumbnails & menu links → forward, breadcrumbs → back
- [x] Header anchored during transitions (`viewTransitionName: 'site-header'`)
- [x] `prefers-reduced-motion: reduce` — disables all view transition animations
- [x] GSAP ScrollTrigger registered globally (`src/lib/gsap.ts`)
- [x] React Compiler compatible (no manual memoization conflicts)
- [x] Build clean, lint clean, 33 tests passing

---

## Next Step

### Step 9: Polish & Verification

#### 9a: ThumbnailGrid fidelity
- [x] Vertical list layout (not grid) — matches legacy `.thumb-list`
- [x] Item layout: label left + image right — matches legacy `.thumb-item-container`
- [x] Aligned to right side of screen (`ml-auto`)
- [x] Hover: brown border + shadow — matches legacy `.thumb-img:hover`
- [x] `CONTENT_BASE` made relative (`/content`), images symlinked from legacy
- [x] Remove ScrollTrigger from `ThumbnailItem` — stagger on mount instead
- [x] Item initial opacity `0` → `0.05`
- [x] Add entrance delay to grid container slide
- [ ] Verify exit via View Transitions
- [x] Match stagger timing to legacy

#### 9b: Background image
- [x] Add `bg.jpg` + gradient fallback to body/layout

#### 9b2: Breadcrumbs fidelity
- [x] Matches legacy positioning and styling

#### 9b3: Language switcher
- [x] Fixed bottom-left, `{{otherversions}}` interpolation

#### 9b4: Dev ergonomics
- [x] `data-component` attributes on all components

#### 9c: Nav fidelity
- [x] Matches legacy positioning, animation, and timing
- [x] `whitespace-nowrap` prevents line wrapping

---

## Upcoming Steps

| Step | Migration Phase | Description | Status |
|------|----------------|-------------|--------|
| 1 | — | Legacy App Audit | ✅ Done |
| 2 | — | Research | ✅ Done |
| 3 | — | Plan & Progress | ✅ Done |
| 4 | Phase 1 | Project Setup & Architecture | ✅ Done |
| 5 | Phase 2 | Data Layer & Content Types | ✅ Done |
| 6 | Phase 3 | Layout & Navigation Shell | ✅ Done |
| 7 | Phase 4 | Content Views | ✅ Done |
| 8 | Phase 5 | Animation & Transitions | ✅ Done |
| 9 | Phase 6 | Polish & Verification | In Progress |
| 10 | Phase 7 | Deployment & Cutover | Not Started |

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-24 | Option C repo structure (additive) | Lowest friction, legacy Heroku untouched, modern in `modern/` |
| 2026-06-24 | Next.js 16 (App Router) | SPA + shared state + agent-first tooling |
| 2026-06-24 | GSAP 3.15 | Direct migration path from legacy GSAP 1.x, now free |
| 2026-06-24 | Zustand + URL state | Minimal global state, URL-driven nav |
| 2026-06-24 | Vitest + Playwright | Fast units + visual E2E for animation fidelity |
| 2026-06-24 | Vercel | Native Next.js, preview deploys, Adapter API exit |
| 2026-06-24 | next-intl | URL-based i18n, SEO-friendly |
| 2026-06-24 | Tailwind CSS 4 | Agent-friendly, zero runtime |
