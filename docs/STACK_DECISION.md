# Stack Decision

**Date:** 2026-06-24
**Context:** Animated portfolio SPA, ~80 items, bilingual (en/es), GSAP animations, nested navigation, canvas drawing, video playback.

---

## Framework: Next.js 16 (App Router)

### Candidates Evaluated

| Framework | Strengths | Weaknesses (for this project) |
|-----------|-----------|-------------------------------|
| **Next.js 16** | Full SPA with App Router, React 19.2 View Transitions, agent-first tooling (AGENTS.md, agent devtools, browser log forwarding), massive ecosystem, Turbopack stable | More JS shipped than Astro, Vercel-centric defaults |
| Astro | Zero JS by default, content-first, View Transitions, islands architecture | Islands model adds friction for SPA with shared state and cross-component animation choreography |
| SvelteKit | Small bundles, built-in transitions, Svelte 5 runes | Smaller ecosystem, fewer AI training examples, animation library ecosystem thinner |
| Remix | Excellent data loading, web standards | Less animation/SPA-focused, less momentum |
| Nuxt/SolidStart | Good options | Smaller ecosystems, less agent tooling support |

### Decision Rationale

1. **SPA nature of the app** — The legacy app is a fully interactive SPA with persistent state (nav, breadcrumbs, current item, language), animated transitions between views, and a canvas-based nav. This is not a content-read site; it's an interactive experience. Next.js App Router handles this natively without island coordination overhead.

2. **Agent maintainability** — Next.js 16.2 explicitly invests in AI agent workflows: `AGENTS.md` support in `create-next-app`, browser log forwarding for agent debugging, experimental agent devtools, dev server lock file. This directly serves the project's "agent-maintained portfolio" goal.

3. **React ecosystem** — React is the most widely supported framework for AI code generation (largest training corpus). Libraries like GSAP, video players, and i18n solutions have first-class React support.

4. **View Transitions** — React 19.2 (bundled with Next.js 16) ships native View Transitions support, enabling smooth animated page transitions.

5. **TypeScript** — First-class support with typed routes, route export validation.

6. **Deployment flexibility** — Next.js 16.2 Adapter API enables deployment to Vercel, Netlify, Cloudflare, or self-hosted. Not locked in.

---

## Animation: GSAP 3

### Candidates Evaluated

| Library | Strengths | Weaknesses (for this project) |
|---------|-----------|-------------------------------|
| **GSAP 3.15** | Direct upgrade path from legacy GSAP 1.x, 100% free (Webflow acquisition), all plugins included, timeline model, ScrollTrigger, `gsap.context()` for React cleanup | Imperative API (less "React-native") |
| Motion (Framer Motion) | Declarative React API, layout animations, exit animations, springs, MIT, AI Kit | Different mental model from legacy, less suited to complex choreographed sequences |
| CSS/View Transitions | Zero library, native | Insufficient for complex staggered timelines and canvas animations |

### Decision Rationale

1. **Direct migration path** — Legacy uses GSAP 1.x (TweenLite, CSSPlugin). GSAP 3 has the same timeline-based mental model with modernized API. Existing animation timings, easings, and sequences map directly.

2. **Now 100% free** — Since April 2025 (Webflow acquisition), all GSAP plugins are free: ScrollTrigger, ScrollSmoother, SplitText, MorphSVG, Flip, Draggable, etc.

3. **Complex choreography** — The app has 8 animation sequences with staggered delays, canvas integration, and cross-component coordination. GSAP's timeline model handles this natively.

4. **React integration** — `gsap.context()` (since 3.11) provides proper cleanup for React components. `gsap.matchMedia()` handles responsive animations.

5. **Ecosystem maturity** — Largest web animation community, extensive documentation, works with any framework.

### Hybrid Approach

Use GSAP 3 for complex sequenced/choreographed animations (nav, thumbnails, transitions) and CSS transitions for simple hover/focus states. This matches the legacy app's pattern.

---

## State Management: Zustand + URL State

### Candidates Evaluated

| Library | Strengths | Weaknesses (for this project) |
|---------|-----------|-------------------------------|
| **Zustand** | Tiny (1KB), zero boilerplate, TypeScript-first, works outside React, simple patterns | Less opinionated (could be a strength) |
| Jotai | Atomic model, great for derived state | Atomic model is overkill for this simple state shape |
| Redux Toolkit | Proven at scale, devtools | Overkill — too much boilerplate for ~5 state values |
| TanStack Query | Excellent for async server state | Data is a static JSON import, not a server API |
| React Context | No dependency, built-in | Re-render issues at scale, less agent-friendly patterns |

### Decision Rationale

1. **Minimal state** — The app has very little global state: language preference, nav open/close, current animation state. Most "state" is URL-derived (current item/route).

2. **URL state first** — Next.js App Router handles route state. Current portfolio item, category, and breadcrumb path all derive from the URL. No store needed for navigation.

3. **Zustand for the rest** — Language preference and any cross-component UI state (nav drawer, animation coordination) goes in a tiny Zustand store. Simple, predictable, agent-friendly.

4. **Static data** — The portfolio JSON is loaded once (as a static import or fetched at build time via `getStaticProps`-equivalent). No TanStack Query needed.

---

## Testing: Vitest + Playwright

### Candidates Evaluated

| Tool | Category | Strengths | Weaknesses |
|------|----------|-----------|------------|
| **Vitest** | Unit/integration | Vite-native, fast, ESM-first, Jest-compatible API, built-in coverage | — |
| Jest | Unit/integration | Mature, widely known | Slower, CJS-first, requires transform config |
| **Playwright** | E2E | Cross-browser, stable API, visual regression, great DX | Heavier than component tests |
| Cypress | E2E | Good DX, component testing | Slower, Chromium-first, paid dashboard |

### Decision Rationale

1. **Vitest** — The project will use Vite (via Next.js Turbopack or directly). Vitest is the natural unit testing companion: zero config, fast, ESM-native. Jest-compatible API means vast existing patterns work.

2. **Playwright** — Industry standard for E2E testing. Critical for this project because animation fidelity must be validated visually. Playwright supports visual comparison screenshots and cross-browser testing.

3. **Testing strategy:**
   - Unit tests: Components, data transformations, utility functions (Vitest)
   - Integration tests: Route navigation, state interactions (Vitest + React Testing Library)
   - E2E tests: Full animation flows, visual regression, bilingual content (Playwright)
   - Target: >80% coverage (per success criteria)

---

## Deployment: Vercel

### Candidates Evaluated

| Platform | Strengths | Weaknesses |
|----------|-----------|------------|
| **Vercel** | Native Next.js support (they build it), zero-config, preview deployments, edge functions, image optimisation, analytics, CI/CD | Vendor coupling (mitigated by Adapter API) |
| Netlify | Good static/Astro support, similar features | Not native to Next.js, some Next.js features lag |
| Cloudflare Pages | Edge-first, great performance, generous free tier | Next.js support via OpenNext (community-maintained) |

### Decision Rationale

1. **Native integration** — Vercel builds Next.js. Deployment is zero-config. All Next.js features work immediately without adaptation layers.

2. **Preview deployments** — Every PR gets a preview URL. Critical for visual review of animation changes.

3. **Modern app in `modern/` folder** — Per the Option C decision, the modern app lives in `modern/`. Vercel natively supports "root directory" settings to deploy from a subfolder.

4. **Exit strategy** — Next.js 16.2 Adapter API means the app can be moved to Netlify, Cloudflare, or self-hosted if needed. No permanent lock-in.

---

## Internationalisation: next-intl

For bilingual content (en/es):
- **next-intl** — Purpose-built for Next.js App Router, URL-based routing (`/en/...`, `/es/...`), static rendering support, TypeScript-safe message keys.
- Replaces the legacy cookie-based approach with SEO-friendly URL-based language handling.
- Improves on legacy: search engines can index both language versions, users can share language-specific URLs.

---

## CSS/Styling: Tailwind CSS 4

| Option | Strengths | Weaknesses |
|--------|-----------|------------|
| **Tailwind CSS 4** | Utility-first, zero runtime, great DX, massive ecosystem, AI agents generate it fluently | Verbose class lists |
| CSS Modules | Scoped, no runtime, framework-native | Less agent-friendly (naming), more files |
| Styled Components / Emotion | Component-scoped, dynamic | Runtime cost, SSR complexity |

**Decision:** Tailwind CSS 4 — AI agents produce Tailwind fluently (largest pattern library), zero runtime cost, works perfectly with Next.js, and the responsive design patterns match the portfolio's needs.

---

## Summary

| Category | Choice | Key Reason |
|----------|--------|------------|
| Framework | Next.js 16 (App Router) | SPA with shared state + agent-first tooling |
| Animation | GSAP 3.15 | Direct migration from legacy GSAP 1.x, now 100% free |
| State | Zustand + URL state | Minimal global state, URL-driven navigation |
| Testing | Vitest + Playwright | Fast units + visual E2E for animation fidelity |
| Deployment | Vercel | Native Next.js, preview deploys, exit via Adapter API |
| i18n | next-intl | URL-based, SEO-friendly, TypeScript-safe |
| Styling | Tailwind CSS 4 | Agent-friendly, zero runtime, responsive utilities |

---

## Agent Maintainability Assessment

All choices optimise for AI agent maintenance:

1. **Next.js** — Explicit agent tooling (AGENTS.md, agent devtools, browser log forwarding). React is the most AI-generated framework.
2. **GSAP** — Extensive documentation, consistent API patterns. Imperative style is actually easier for agents (explicit cause→effect vs declarative inference).
3. **Zustand** — Minimal, predictable patterns. Agents can reason about state flow trivially.
4. **Vitest/Playwright** — Standard testing APIs. Agents can write and run tests confidently.
5. **Tailwind** — Utility classes are highly pattern-matchable. AI agents generate Tailwind more accurately than custom CSS.
6. **TypeScript throughout** — Type errors surface issues immediately. Agents get IDE-level feedback.
