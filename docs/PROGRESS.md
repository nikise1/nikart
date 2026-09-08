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

## Current Step

### Step 10: WIP Deploy to Vercel Preview (2026-09-07)

Reprioritized ahead of remaining Step 9 polish — live preview URL enables visual review of animations and assets.

**Prerequisites verified:**
- [x] Production build passes locally (`npm run build` in `modern/`)
- [x] `vercel.json` present in `modern/` (`framework: nextjs`; no `outputDirectory`)
- [x] Repo on GitHub: `https://github.com/nikise1/nikart`
- [x] Content images: one git copy at repo-root `public/content/img`; install/build copies into `modern/public/_generated/img/` (gitignored); rewrite `/content/img/*` → `/_generated/img/*`
- [x] `sync:images` is symlink-safe (staging copy; never copies onto the legacy folder)
- [x] Node `22` pinned via `modern/.nvmrc` and `modern/package.json` `engines`

**One-time setup:**
- [x] Git repo imported to Vercel project [`nikise1s-projects/nikart`](https://vercel.com/nikise1s-projects/nikart)
- [x] Root Directory `modern/`; include files outside root enabled
- [x] Framework Next.js; Node 22; no WIP env vars
- [x] `master` auto-deploys — first Git deploy (`8cc8046`) failed; `e70e2b1` succeeded
- [x] Deployment dashboard: [e70e2b1](https://vercel.com/nikise1s-projects/nikart/EnPwiCayBWymivxog83ojpYMvWnR)

**Post-deploy checklist:**
- [ ] `/en/` and `/es/` routes render
- [ ] Thumbnail images load (`/content/img/`)
- [ ] Nav open/close animation on preview (not just local)
- [ ] Video/games rewrites work (`static.nikart.co.uk` via `next.config.ts`)
- [ ] `/fl` Flash archival route loads
- [ ] Deployment Protection currently requires Vercel login — disable or add viewers before sharing a public preview URL

---

### Step 9: Polish & Verification (continues in parallel)

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
- [x] Nav animation phase state machine in Zustand (`nav-store.ts`) — startup close-then-open, item stagger, canvas/button sequencing, deferred route navigation on item click
- [x] Central `useNavAnimator` orchestrator mirrors legacy `nav-view.js doAni()` (single tween scope, kill on interrupt)
- [x] NavButton is back-to-main only — hidden on home, shown off main, click navigates to `/`

#### 9d: Toolchain maintenance (modern app) ✅ (2026-07-15)
- [x] Added `modern/.nvmrc` with Node `22` to match repo engine target
- [x] Stage 1 safe dependency updates in `modern/`:
  - `next` `16.2.9` → `16.2.10`
  - `eslint-config-next` `16.2.9` → `16.2.10`
  - `next-intl` `4.13.1` → `4.13.2`
  - `tailwindcss` `4.3.1` → `4.3.2`
  - `@tailwindcss/postcss` `4.3.1` → `4.3.2`
  - `vitest` `4.1.9` → `4.1.10`
  - `eslint` `9.39.4` → `9.39.5`
- [x] Stage 2 dependency updates in `modern/`:
  - `react` `19.2.4` → `19.2.7`
  - `react-dom` `19.2.4` → `19.2.7`
- [x] Validation after Stage 1/2: lint clean, tests passing (33/33)

#### 9e: Package manager standardization (modern app) ✅ (2026-07-15)
- [x] Added `packageManager: npm@10` in root and modern `package.json`
- [x] Validation after standardization: npm install clean, lint clean, tests passing (33/33)
- [x] Terminology sync: updated `docs/MIGRATION_PLAN.md` to use Progress-aligned `Step` labels instead of `Phase`

#### 9f: Flash archival route (`/fl`) ✅ (2026-08-04)
- [x] Ruffle-based `/fl` page in `modern/` (legacy SWF + flashVars)
- [x] `/fl/:lang` redirect sets locale cookie (legacy parity)
- [x] Unit tests for `flash-config` helpers
- [x] Fix blank SWF: serve `data.json`, Ruffle `base` URL, `window.nikart` bridge, AS2 player settings
- [x] Fix empty `#swf_container`: self-host Ruffle at `/ruffle/ruffle.js` (CDN path `/dist/ruffle.js` was 404)

#### 9g: Slideshow interaction ✅ (2026-09-07)

- [x] Extract `Slideshow` from `ArticleView` (`src/components/slideshow/slideshow.tsx`)
- [x] Swipe left/right to change slides (pointer events, 48px threshold)
- [x] Hover zones: left/right thirds show gradient arrows and click prev/next (no pause); middle third pauses with a two-bar glyph
- [x] Centre click toggles sticky play/pause (hovering the middle then clicking locks pause; a second click plays even while still hovering)
- [x] Left/right click flashes arrows then fades them on all devices, including desktop hover
- [x] Progress `n / total` centred under the images, clickable to advance
- [x] Colocated unit tests for arrows, swipe, pause zones, progress click, and single-image mode

---

### Cloud Agent Dev Environment ✅ (2026-09-07)

- [x] Added repo-managed `.cursor/environment.json` (default image, Node 22 preinstalled)
- [x] `install` installs both apps: `npm install && npm install --prefix modern` (modern `postinstall` copies Ruffle + syncs content images)
- [x] `terminals`: `modern` (Next.js dev :3000) and `legacy` (Express/Swig :5000); `ports` 3000 + 5000 exposed
- [x] Verified end-to-end: install idempotent, lint clean, 59 unit tests passing, production build clean
- [x] Both servers serve: modern `/` → `/en` (200), `/es` (200); legacy `/` → 302, `/html5/` (200)

---

## Upcoming Steps

| Step | Description | Status |
|------|-------------|--------|
| 1 | Legacy App Audit | ✅ Done |
| 2 | Research | ✅ Done |
| 3 | Plan & Progress | ✅ Done |
| 4 | Project Setup & Architecture | ✅ Done |
| 5 | Data Layer & Content Types | ✅ Done |
| 6 | Layout & Navigation Shell | ✅ Done |
| 7 | Content Views | ✅ Done |
| 8 | Animation & Transitions | ✅ Done |
| 9 | Polish & Verification | In Progress (parallel) |
| 10 | WIP Deploy to Vercel Preview | **Current** (project live; smoke tests pending) |
| 11 | Production Cutover | Not Started |

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
| 2026-07-28 | `modern/` is the main app; run via `npm run modern` | Root AGENTS.md documents one-word `modern` shortcut |
| 2026-09-02 | Step 10 (Vercel preview) before remaining Step 9 polish | Live preview URL needed for visual review of animations/assets |
| 2026-09-07 | Vendor `modern/public/content/img` + drop `outputDirectory` | Vercel Root Directory cannot follow the legacy symlink; `.next` as output breaks Next.js middleware/SSR |
| 2026-09-07 | `sync:images` never copies onto the legacy symlink | `cp` errors when dest is `../../../public/content/img` (same dir as source) |
| 2026-09-07 | Keep a single git copy of images at repo-root `public/content/img` | Avoid duplicates and leave the legacy app untouched; modern copies at install/build |
| 2026-09-07 | Generated images live at `modern/public/_generated/img` | Distinct from legacy `public/content/img` so gitignore cannot collide; app still uses `/content/img/` via rewrite |
