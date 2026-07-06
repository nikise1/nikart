# Migration Plan

**Date:** 2026-06-24
**Stack:** Next.js 16 + GSAP 3 + Zustand + Tailwind CSS 4 + Vitest/Playwright + Vercel
**Strategy:** Option C — modern app in `modern/`, legacy untouched at root

---

## Phases

### Phase 1: Project Scaffold & Infrastructure

| Task | Effort | Notes |
|------|--------|-------|
| Init Next.js 16 in `modern/` | Small | `create-next-app` with App Router, TypeScript, Tailwind, ESLint |
| Configure TypeScript strict mode | Small | Strict config, path aliases |
| Set up Vitest + React Testing Library | Small | Unit/integration test harness |
| Set up Playwright | Small | E2E test harness with visual comparison |
| Configure next-intl (en/es routing) | Small | `/en/...` and `/es/...` URL structure |
| Install GSAP 3 + React integration | Small | `gsap.context()` pattern, shared timeline utils |
| Set up Zustand store | Small | Language pref, UI state (nav open/close) |
| Create AGENTS.md + code conventions | Small | Agent maintainability rules |
| Vercel project config (root = `modern/`) | Small | Preview deploys from PRs |

**Phase effort: ~1 session**

---

### Phase 2: Data Layer & Content Types

| Task | Effort | Notes |
|------|--------|-------|
| Type the JSON data model | Small | TypeScript interfaces for menu tree, item types |
| Validate and import `data.json` | Small | Static import with runtime validation (Zod) |
| Create typed content access utilities | Small | Tree traversal, path resolution, breadcrumb generation |
| Unit tests for data utilities | Small | Path lookup, language field access, type narrowing |

**Phase effort: ~1 session**

---

### Phase 3: Layout & Navigation Shell

| Task | Effort | Notes |
|------|--------|-------|
| App layout (responsive shell) | Medium | Root layout with nav area, content area, responsive breakpoints |
| Route structure (dynamic segments) | Medium | `[lang]/[...path]` mapping to JSON tree |
| Nav component (open/close, items) | Medium | Zustand-driven, renders menu tree |
| Nav canvas bezier shape | Small | Port ~30 lines of canvas drawing |
| Breadcrumbs component | Small | Derive from URL path, type-safe |
| Language switcher | Small | URL-based via next-intl |

**Phase effort: ~2 sessions**

---

### Phase 4: Content Views

| Task | Effort | Notes |
|------|--------|-------|
| Thumbnail grid view | Medium | Filter/display items, responsive grid |
| Thumbnail item component | Small | Image + label, hover state |
| Article view (text/web/image) | Medium | Type-driven rendering, image slideshow |
| Video view | Small | Native `<video>` with H.264/WebM sources |
| Menu/category landing view | Small | Display submenu items or thumbnails |

**Phase effort: ~2 sessions**

---

### Phase 5: Animation & Transitions

| Task | Effort | Notes |
|------|--------|-------|
| Nav open/close animation | Medium | GSAP timeline, staggered item entrance |
| Nav item curved stagger | Medium | Port margin-left curve calculation + fade |
| Nav canvas circle reveal | Small | GSAP-driven canvas arc animation |
| Thumbnail panel slide in/out | Small | GSAP `right` property tween |
| Thumbnail item entrance (fade + scale) | Medium | Staggered `autoAlpha` + `scale` with scroll trigger |
| Article/video fade transitions | Small | `autoAlpha` 0↔1 |
| Image slideshow cross-fade | Small | Stacked elements with `autoAlpha` |
| View Transitions (route changes) | Medium | React 19.2 View Transitions API integration |

**Phase effort: ~2–3 sessions**

---

### Phase 6: Polish & Verification

#### 6a: ThumbnailGrid fidelity

Legacy `thumb-view.js` / `thumb-item-view.js` differences from modern `ThumbnailGrid`:

| Aspect | Legacy | Modern (current) | Fix |
|--------|--------|-------------------|-----|
| Item entrance trigger | Immediate on container open | ScrollTrigger (viewport) | Remove ScrollTrigger, stagger on mount |
| Item initial opacity | `0.05` (ghost) | `0` (invisible) | Change to `0.05` |
| Container entrance | `right: -300 → 0` after `timeDelayThumbIn` delay | `gsap.from({ x: 300 })` immediately | Add delay |
| Container exit | Slides to `right: -300`, clears items | View Transitions | Acceptable (React handles unmount) |
| Stagger timing | Per-item delay in `aniIn()` | `index * 0.08` | Verify against legacy constants |

#### 6b: Background image

Legacy body styling:
- `bg.jpg` top-left no-repeat, cover, fixed
- Gradient fallback: `#D6D59D` → `#94B864`
- Background color: `#bcc986`

Modern needs: apply same background to root layout or `globals.css` body.

#### 6c: Nav fidelity

Legacy `nav-container` / `nav-view.js` behavior:
- `position: fixed; top: 0; left: 0`
- Nav button starts off-screen (`left: -30`, `top: -height`), slides into view
- Canvas positioned absolute within container
- Canvas bezier shape drawn with specific coordinates: `moveTo(20,0)`, `bezierCurveTo(70,83,92,167,...)`, `quadraticCurveTo(...)`
- Open: shows items container, draws canvas, staggers `aniIn` per item
- Close: staggers `aniOut` in reverse, hides after last item finishes (`timeNavOut + (n-1) * timeNavStaggerOut`)

#### 6d: General polish

| Task | Effort | Notes |
|------|--------|-------|
| Visual regression tests (Playwright) | Medium | Capture key states, compare against legacy |
| Responsive testing (mobile/tablet/desktop) | Small | Tailwind breakpoints, orientation handling |
| Accessibility audit | Small | Focus management, ARIA, keyboard nav, zoom |
| Performance audit (Lighthouse) | Small | Bundle size, LCP, animation jank |
| SEO (metadata, OG tags, sitemap) | Small | Per-route metadata via Next.js generateMetadata |
| Bilingual content verification | Small | All items render correctly in en/es |
| Fix external asset references | Small | Verify/update static.nikart.co.uk links |

**Phase effort: ~2–3 sessions**

---

### Phase 7: Deployment & Cutover

| Task | Effort | Notes |
|------|--------|-------|
| Vercel production deployment | Small | Configure custom domain |
| DNS cutover (nikart.co.uk → Vercel) | Small | After verification period |
| Legacy cleanup commit | Small | Remove legacy files, promote `modern/` to root |
| Decommission Heroku app | Small | After DNS propagation confirmed |

**Phase effort: ~1 session**

---

## Effort Summary

| Phase | Estimated Sessions | Dependency |
|-------|-------------------|------------|
| 1. Scaffold & Infrastructure | 1 | — |
| 2. Data Layer & Content Types | 1 | Phase 1 |
| 3. Layout & Navigation Shell | 2 | Phase 2 |
| 4. Content Views | 2 | Phase 3 |
| 5. Animation & Transitions | 2–3 | Phase 4 |
| 6. Polish & Verification | 1–2 | Phase 5 |
| 7. Deployment & Cutover | 1 | Phase 6 |
| **Total** | **10–12 sessions** | |

A "session" = one focused working block with AI agent collaboration.

---

## Agent Maintainability Requirements

### Code Conventions (enforced via AGENTS.md + ESLint)

1. **TypeScript strict** — No `any`, no implicit returns, strict null checks. Agents get immediate type error feedback.
2. **One component per file** — Named exports matching filename. Agents can locate and modify components by name.
3. **Colocation** — Component, styles, tests, and types in the same directory. Agents find related code without searching.
4. **Explicit props** — All component props defined as named interfaces (not inline). Agents read intent from types.
5. **GSAP patterns** — All animations use `gsap.context()` with cleanup in `useEffect` return. Standard pattern agents can replicate.
6. **Zustand slices** — Each store slice in its own file with typed actions. Agents modify state without understanding the entire store.
7. **URL-driven state** — Navigation state lives in the URL. Agents test routes directly without setup.

### Testing Requirements

1. **Every component has a test file** — Colocated `*.test.tsx`. Agents verify changes immediately.
2. **Data utilities have >90% coverage** — Core path resolution and type narrowing must be tested.
3. **E2E tests cover critical flows** — Nav open → select item → view content → change language. Agents run these as smoke tests.
4. **Visual regression baselines** — Key animation states captured. Agents detect unintended visual changes.

### Documentation Requirements

1. **AGENTS.md at `modern/` root** — Describes project structure, commands, patterns, and constraints for AI agents.
2. **README.md** — Human-readable setup and architecture overview.
3. **Inline comments only for "why"** — Code should be self-documenting. Comments explain non-obvious decisions only.

### CI/CD Requirements

1. **Pre-commit:** TypeScript check + ESLint (via lint-staged)
2. **PR checks:** Vitest (unit/integration) + Playwright (E2E) + build
3. **Preview deploys:** Every PR gets a Vercel preview URL for visual review
4. **Main branch:** Auto-deploy to production on merge

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Animation fidelity loss | Visual regression tests comparing legacy screenshots to modern |
| External video host unavailable | Verify `static.nikart.co.uk` early; fallback plan to self-host media |
| GSAP React integration complexity | Use established `gsap.context()` pattern; isolate animation logic in custom hooks |
| Scope creep (redesign temptation) | Phase 5 is about faithful reproduction; any redesign is a separate future phase |
| Agent-generated code quality | Strict TypeScript + ESLint + pre-commit hooks catch issues immediately |
