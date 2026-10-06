# Migration Plan

**Date:** 2026-06-24
**Stack:** Next.js 16 + GSAP 3 + Zustand + Tailwind CSS 4 + Vitest/Playwright + Vercel
**Strategy:** Option C — modern app in `modern/`, legacy untouched at root

---

## Steps

### Step 4: Project Setup & Architecture

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

**Step effort: ~1 session**

---

### Step 5: Data Layer & Content Types

| Task | Effort | Notes |
|------|--------|-------|
| Type the JSON data model | Small | TypeScript interfaces for menu tree, item types |
| Validate and import `data.json` | Small | Static import with runtime validation (Zod) |
| Create typed content access utilities | Small | Tree traversal, path resolution, breadcrumb generation |
| Unit tests for data utilities | Small | Path lookup, language field access, type narrowing |

**Step effort: ~1 session**

---

### Step 6: Layout & Navigation Shell

| Task | Effort | Notes |
|------|--------|-------|
| App layout (responsive shell) | Medium | Root layout with nav area, content area, responsive breakpoints |
| Route structure (dynamic segments) | Medium | `[lang]/[...path]` mapping to JSON tree |
| Nav component (open/close, items) | Medium | Zustand-driven, renders menu tree |
| Nav canvas bezier shape | Small | Port ~30 lines of canvas drawing |
| Breadcrumbs component | Small | Derive from URL path, type-safe |
| Language switcher | Small | URL-based via next-intl |

**Step effort: ~2 sessions**

---

### Step 7: Content Views

| Task | Effort | Notes |
|------|--------|-------|
| Thumbnail grid view | Medium | Shows ALL children of a menu node (sub-menus + content items) — matches legacy `thumb-view.js` rendering `curItem.menu` |
| Thumbnail item component | Small | Image + label, hover state. Accepts any `DataNode` (not just `ContentItem`) |
| Article view (text/web/image) | Medium | Type-driven rendering, image slideshow |
| Video view | Small | Native `<video>` with H.264/WebM sources |

Note: No dedicated "menu landing" view exists in legacy. Menu nodes always show thumbnail grid of their children. `MenuLanding` was removed.

**Step effort: ~2 sessions**

---

### Step 8: Animation & Transitions

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

**Step effort: ~2–3 sessions**

---

### Step 9: Polish & Verification

#### 6a: ThumbnailGrid fidelity

Legacy `thumb-view.js` / `thumb-item-view.js` differences from modern `ThumbnailGrid`:

| Aspect | Legacy | Modern (current) | Fix |
|--------|--------|-------------------|-----|
| Item entrance trigger | Immediate on container open | IntersectionObserver (threshold 0.01, per item) + GSAP | Switch to observer-driven visibility transitions (`observerEnter`/`observerLeave`) for deterministic play/reset; keep tween cancellation on reset; dev logs via shared `devDebug` utility |
| Item initial opacity | `0.05` (ghost) | `0.05` (on image container) | Matched |
| Container entrance | `right: -300 → 0` after `timeDelayThumbIn` delay | `gsap.from({ x: 300 })` immediately | Add delay |
| Container exit | Slides to `right: -300`, clears items | View Transitions | Acceptable (React handles unmount) |
| Stagger timing | Per-item delay in `aniIn()` | `index * 0.08` | Verify against legacy constants |
| Mobile heading width (2026-10-06) | Full-width `text-2xl` title | Below `md`, article and video `h1` width is `calc(100% - 5.5rem)` and aligned to the end. The closed menu curl sits at `left: 0` and is 90px wide; this inset starts the line about 14px past it. `md` (768px) and up stay full width and centered, which clears the longest title | Applied |

#### 6b: Background image

Legacy body styling:
- `bg.jpg` top-left no-repeat, cover, fixed
- Gradient fallback: `#D6D59D` → `#94B864`
- Background color: `#bcc986`

Modern needs: apply same background to root layout or `globals.css` body.

#### 6b2: Breadcrumbs fidelity

Legacy breadcrumb styling (`_nav.scss`):
- `position: fixed; top: -0.3em; left: 6em`
- Each item: `.breadcrumb-container` flex, `margin: 0 0.3em 0 0`
- Connector: `stump.png` 15×12px, `rotate(75deg)`, before every item
- Link: `display: inline-block; padding: 0.3em 0 0 0`
- Hidden when nav is open
- Entrance (modern): only newly added crumbs animate — stump notches drop in from above the page top (staggered with `NAV_TIMING.staggerIn`) and rest at `y: -0.3em`; after each new notch lands (`NAV_TIMING.growIn`), the label unmasks via `clip-path` inset (left-to-right, `BREADCRUMB_TEXT_IN` 0.75s) so reserved width does not shove later crumbs. Removed crumbs reverse: mask out, then the notch moves up. Unchanged crumbs stay put. The live trail is stored in Zustand (`breadcrumb-store.ts`) so a view-transition remount still diffs against the previous crumbs instead of replaying the whole bar.
- Breadcrumbs render outside the `site-header` view-transition group so the GSAP entrance is not snapshotted/frozen during route changes
- A single click navigates. The current crumb is not a link (`aria-current="page"`), so it does not start a same-page view transition that swallows the next click. The link is the whole crumb (stump and label), so a clip-path reveal does not shrink the hit target. View-transition snapshots set `pointer-events: none` from a style tag in the root layout (the CSS pipeline drops `::view-transition-group(*)`). Trail changes revert the previous GSAP tweens before starting the next ones.
- Narrow viewports (`max-sm`): the bar is bounded to the right of the `6em` inset. Ancestor labels cap at `8rem` with ellipsis. The current title keeps the remaining width and ellipsizes only if it still overflows. Exiting crumbs shrink before that title so a long leaf does not crush the page you landed on. At `sm` and wider the trail stays full width. Notch travel is not clipped (`overflow` stays visible on the bar).

#### 6b3: Language switcher

- No legacy equivalent (language set server-side via `nikart.langCode`)
- Modern: fixed bottom-left position
- Legacy `{{otherversions}}` menu item interpolated as "Config" in `localize()`

#### 6b4: Dev ergonomics

- `data-component` attributes on all component root elements for DOM identification
- Components: Nav, NavButton, NavCanvas, NavItems, Breadcrumbs, LanguageSwitcher, ContentPage, ThumbnailGrid, ThumbnailItem, ArticleView, Slideshow, VideoView

#### 6c: Nav fidelity

Legacy `nav-container` / `nav-view.js` behavior:
- `position: fixed; top: 0; left: 0`
- Nav button starts off-screen (`left: -30`, `top: -height`), slides into view
- Canvas positioned absolute within container
- Canvas bezier shape drawn with specific coordinates: `moveTo(20,0)`, `bezierCurveTo(70,83,92,167,...)`, `quadraticCurveTo(...)`
- Open: shows items container, draws canvas, staggers `aniIn` per item
- NavButton click: reverse of the enter tween (`from (0,0)` back to `left: -30, top: -height`, `power1.in`) on the current page, then navigate home. Ignore extra clicks only while that tween is running (`gsap.isTweening`) so a later reveal stays clickable.
- Close: staggers `aniOut` in reverse, hides after last item finishes (`timeNavOut + (n-1) * timeNavStaggerOut`)
- Nav items: `white-space: nowrap` (legacy `overflow: hidden` on 32px-height wrapper clips text)
- Item width animates from 0 to measured text width + 20px padding
- Container width: `$navWidth = 15em`
- Animation sequencing via Zustand `navPhase` state machine (`closed` → `closing-items` → `closing-canvas` → `opening` → `open`); central `useNavAnimator` hook mirrors legacy `doAni()` with tween kill on phase change; startup and route-to-main run close-then-open; canvas uses `left`/`top` at 130×260; item width measured on label only; close animates width only (no alpha)

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

#### 6e: Flash archival route (`/fl`)

Legacy Flash portfolio preserved via [Ruffle](https://ruffle.rs/) at `/fl` (outside locale routing):

- `modern/src/app/fl/` — minimal black layout matching legacy `fl.html`
- `modern/src/components/flash-player/` — Ruffle embed (CDN `@ruffle-rs/ruffle@0.5.0`)
- `modern/public/fl/main.swf` — untouched Animate export, copied from legacy `public/fl/main.swf`
- `modern/public/fl/main.ruffle.swf` — named copy of that SWF with Ruffle-only Drawing API patches; `/fl` loads this file, not `main.swf`
- `modern/public/content/json/data.json` — required by SWF (`../content/json/data.json` via Ruffle `base`). The git copy is pretty-printed repo-root `public/content/json/data.json`; `sync:json` minifies it here on install and on the Vercel build (gitignored). Next imports the pretty repo-root file (2026-10-06).
- `modern/src/lib/flash-config.ts` — same `flashVars` as legacy (`dotracking`, `embedlang`, `staticfilesstr`)
- `modern/src/lib/flash-bridge.ts` — restores `window.nikart.popWin` / `doTracker` for `javascript:` callbacks from the SWF
- Ruffle nightly build + `playerVersion: 8`, `base` URL, `allowNetworking: "all"` for AS2 (AVM1) compatibility
- Self-hosted Ruffle runtime in `public/ruffle/` (copied via `postinstall`/`prebuild` from `@ruffle-rs/ruffle`; gitignored — Vercel `buildCommand` copies it)
- `/fl/en` and `/fl/es` route handlers set the `NEXT_LOCALE` cookie and redirect to `/fl` (legacy parity). Explicit paths so `/fl/main.swf` cannot be captured by a `[lang]` segment.
- i18n middleware excludes `/fl` so it is not prefixed with `/en` or `/es`
- Lizard tongue chord (2026-09-15): the `/fl` Ruffle preview was drawing the quadratic tongue **and** a straight line between the mouth and the tip. That is not a Next.js/Ruffle embed setting — it is the AVM1 Drawing API path in `main.swf` (FLA timeline frame 22). Original AS2:

  ```
  lizard.tongue.clear();
  lizard.tongue.lineStyle(10,"0x340101",100);
  midx = tongueTarget._x + Math.cos(tongueTarget.curAngle) * 75;
  midy = tongueTarget._y + Math.sin(tongueTarget.curAngle) * 75;
  lizard.tongue.curveTo(midx,midy,tongueTarget._x,tongueTarget._y);
  lizard.tongue.lineStyle(6,"0xBA0101",100);
  lizard.tongue.curveTo(midx,midy,0,0); // returns to origin → closed path / chord
  ```

  Ruffle strokes that closed path, so the return to `(0,0)` shows as a chord and kills the tongue illusion. Fix: copy `main.swf` to `modern/public/fl/main.ruffle.swf` and edit only that copy — `moveTo(0,0)` before each `curveTo`, inner highlight as a second **open** curve to the tip (do not `curveTo` back to the origin). The Animate export stays at `public/fl/main.swf` and `modern/public/fl/main.swf`. `/fl` points at `main.ruffle.swf` (JPEXS, no Animate republish). If you export again from Adobe Animate, replace both `main.swf` files, copy the new export onto `main.ruffle.swf`, and re-apply that frame-22 change on the copy.
- Architecture diagrams (current `/fl` preview + options for S3 Flash, including AwayFL): [`docs/RUFFLE_PREVIEW.md`](RUFFLE_PREVIEW.md) (2026-09-15). `docs/diagrams/*.svg` restored to well-formed UTF-8 (illegal control chars / bare `&` broke XML parse) and HTTPS+CORS labels (2026-10-05).
- AwayFL popup mock: `/fl/away` + `/static` rewrite; `popWin` and HTML5 launches for S3 Flash wrappers open AwayFL instead of a dead swfobject page (Claro is the default).
- Temporary Ruffle vs AwayFL compare kit: one HTML page per SWF with generic players (Ruffle autoplay on, unmute overlay hidden); menu/popWin open `/swf-compare/` instead of the popup. Portfolio movies load from `https://static.nikart.co.uk` (CloudFront HTTPS + CORS, 2026-10-05) so this repo does not copy bucket binaries. Compare HTML lives at `/swf-compare/{id}/` (`pieces/` removed, 2026-10-05). Generated `public/ruffle/` and `public/awayfl/` copies are gitignored again (2026-10-05); keep `loadvars-ondata-patch.js` and `vendor/awayfl-builtins/`. Dropped leftover `/swf-compare/pieces/` aliases (2026-10-05). The `/static` origin proxy remains as a same-origin fallback. The legacy lizard Flash site is `/swf-compare/lizard-site/`: both players load `/fl/main.ruffle.swf` (750×500, `playerVersion: 8`, same flashVars and tongue-chord patch as `/fl`) with Ruffle `base=/fl/` and AwayFL loader URL `/fl/main.ruffle.swf` — no document `<base href>` (Safari was resolving Ruffle WASM under `/fl/` and aborting the movie). Players share one SWF fetch; AwayFL starts after Ruffle. AwayFL LoadVars `../content/json/data.json` is rewritten to `/content/` (it otherwise resolves against the compare HTML page and `_root.dataLoaded` stays false). Next also rewrites `/swf-compare/content/` to `/content/`. Host-side LoadVars `onData` patch (`public/awayfl/loadvars-ondata-patch.js`) makes the instance override writable so `classes.JSON.parse` can run; upstream notes in [`docs/AWAYFL_LOADVARS.md`](AWAYFL_LOADVARS.md). The compare index topnav and intro note link to that page. Index cards (within each group) and piece prev/next follow `swf-compare-catalog.json` order. Each piece id is a key in `localStorage` `swf-compare-pages` with `{ ruffle, awayfl }` booleans (committed defaults in `public/swf-compare/visibility-defaults.json`); Hide/Show buttons next to each player toggle those, and index cards show the two flags as clickable toggles. Compare stages use each SWF’s header stage size in CSS pixels (2026-10-06), not the `data.json` popup window or a column stretched to `100%`. Avis is 500×500 (the window is 600×600). AwayFL `w`/`h` is that stage size (`showAll`). Compare HTML, `visibility-defaults.json`, and a full-window page per movie are compiled from `public/swf-compare/pages.json` and gitignored (`compile-swf-compare.mjs` on postinstall, prebuild, and dev, 2026-10-06). `/swf-compare/{id}/fill.html` stretches one player into a box that fills the viewport while staying clipped to the SWF stage aspect ratio (`exactFit`, 2026-10-06); `/fl` uses the same fill+mask layout for the 750×500 lizard stage and overrides the root portfolio `globals.css` background with `!important` black (same as `/fl/away`) so letterbox regions stay black; the old `fl-fallback` HTML5/compare links under the stage are removed (2026-10-06). `/fl` Ruffle matches compare fill pages (`autoplay: "on"`, `unmuteOverlay: "hidden"`) and pauses detached/unmounted media so Flash NetStream video audio does not keep playing after leaving a video page (2026-10-06). Index/piece hrefs are root-absolute (`/swf-compare/…`) and `/swf-compare` redirects to `/swf-compare/index.html` so relative cards do not break without a trailing slash (2026-10-06). Portfolio launch buttons and `popWin` open that fill page (2026-10-06). The Banners menu item still opens the compare index, because that entry is several movies. AwayFL’s stage size setter skips an axis that already matches the canvas client box, which left the default 300×150 bitmap stretched to the CSS size (2026-10-06). Compare `players.js` and `/fl/away` nudge the size by one pixel and set it again so both bitmap axes update.

#### 6f: Slideshow interaction (2026-09-07)

Modern `Slideshow` (`src/components/slideshow/slideshow.tsx`) extracted from `ArticleView`:

- Horizontal swipe (pointer events, 48px threshold) advances/rewinds slides; vertical pans still scroll
- Image is split into thirds: left/right hover shows edge-fade arrows and click prev/next (autoplay continues); middle hover pauses with a two-bar glyph
- Centre click/tap toggles a sticky play/pause (first click while hovering the middle locks pause; second click plays even if the pointer stays there)
- Hit zones follow the visible `object-contain` image, not the letterboxed frame
- Left/right click flashes the gradient arrow then fades it on every device, including while the pointer stays on that third
- Progress `n / total` sits centred under the images and clicks through to the next slide
- Cross-fade timing unchanged (`1.25s` delay, `0.4s` `autoAlpha`)

Article and video enter/exit (2026-10-06):

Legacy `articleClose` / `videoClose` fade the whole panel out in `timeArticleOut` (0.5s). `articleOpen` / `videoOpen` fade it in over `timeArticleIn` (1.5s). Modern was a 0.4s fade-in only, so the panel disappeared on navigation. `ContentTransition` now fades each block (title, slideshow or player, description, launch) down and out, then the next page's blocks up and in. Leave is 240ms with a 40ms stagger (a full article finishes in about 360ms). Arrival is the same length, starting 60ms after navigation. The thumbnail list keeps the route-level `nav-forward` / `nav-back` transition and does not wrap these blocks. Reduced motion still cuts the animation to 0s.

Maintenance note (2026-07-15):
- Modern app Stage 1 safe dependency updates applied (`next`, `eslint-config-next`, `next-intl`, `tailwindcss`, `@tailwindcss/postcss`, `vitest`, `eslint`) and validated with lint + unit tests.
- Modern app Stage 2 patch updates applied (`react`, `react-dom`) and validated with lint + unit tests.
- Added `modern/.nvmrc` (`22`) to align local runtime selection with repo Node engine target.
- Standardized package manager to npm for modern app: added `packageManager: npm@10` in root/modern `package.json`.
- Simplified `docs/PROGRESS.md` "Upcoming Steps" table to remove redundant separate "Migration Phase" column.
- Removed remaining phase references from the "Step" labels in `docs/PROGRESS.md` to keep the table concise.

**Step effort: ~2–3 sessions**

---

### Step 10: WIP Deploy — Vercel Preview (**current — before remaining Step 9 polish**)

The modern app can be deployed to Vercel as a live preview at any point. This gives a shareable URL for visual review without touching the production domain.

**Order change (2026-09-02):** Step 10 moved ahead of finishing Step 9. Remaining polish (e.g. ThumbnailGrid exit via View Transitions, visual regression, a11y) continues in parallel once a preview URL exists.

**One-time Vercel project setup:** ✅ (2026-09-07)

Project: [`nikise1s-projects/nikart`](https://vercel.com/nikise1s-projects/nikart). Root Directory `modern/`. Latest successful deploy: `e70e2b1`.

1. Go to [vercel.com/new](https://vercel.com/new) → Import Git Repository → select `nikart` repo
2. **Root Directory:** set to `modern/` (critical — do not leave as repo root or Vercel will pick the legacy Express app)
3. Keep **Include source files outside of the Root Directory in the Build Step** enabled (default) so the build can copy repo-root `public/content/img`
4. Build settings come from `modern/vercel.json` (`framework: nextjs`). Do not set Output Directory to `.next` — that breaks next-intl middleware and SSR
5. Framework preset: Next.js (auto-detected); Node `22` from `modern/.nvmrc` / `engines`
6. Environment variables: none required for WIP (static content, no secrets)
7. Click Deploy — first deploy takes ~2 min

**Deploy blockers fixed (2026-09-07):**

- Removed `outputDirectory: ".next"` from `modern/vercel.json` so Vercel uses the Next.js builder instead of serving `.next` as static files
- Do **not** symlink `modern/public/content/img` → `../../../public/content/img` — Next/Vercel copies `public/` and errors with “Cannot copy … to a subdirectory of itself”
- Single git copy stays at legacy `public/content/img` (legacy app untouched). `sync:images` copies into `modern/public/_generated/img/` (gitignored). Rewrite `/content/img/*` → `/_generated/img/*`
- Single git copy of portfolio JSON stays at legacy `public/content/json/data.json`, pretty printed (legacy Backbone still fetches it). `sync:json` minifies it to `modern/public/content/json/data.json` (gitignored) because Flash requests that exact path and Next rewrites do not chain. Next imports the pretty repo-root file (2026-10-06).
- Portfolio JSON is edited in [JSON Editor Online](https://jsoneditoronline.org), not in the app. `npm run json:edit` prints a link that loads `public/content/json/data.json` in tree mode (`#left=json.` plus the compact document). The in-app `/dev/content` editor and the `jsoneditor` dependency are removed (2026-10-06).

**After initial deploy:**

- Every push to `master` auto-deploys (see [Vercel project](https://vercel.com/nikise1s-projects/nikart))
- Every PR/branch gets its own preview URL — use these for visual review of animation changes
- `static.nikart.co.uk` rewrites (video, games) are configured in `next.config.ts` — verify these work on the preview URL
- Deployment Protection is on — preview URLs currently require Vercel login

**Ongoing WIP checklist (per session):**

- [x] Push working branch → Vercel deploy of `e70e2b1` succeeded
- [ ] Verify `static.nikart.co.uk` video/games rewrites load correctly
- [ ] Verify both `/en/` and `/es/` routes render
- [ ] Check nav open/close animation on preview (not just local)
- [ ] Turn off Deployment Protection or add viewers if a public share URL is needed

---

### Step 11: Production Cutover (after Step 9 complete)

| Task | Effort | Notes |
|------|--------|-------|
| Add custom domain in Vercel dashboard | Small | `nikart.co.uk` → Vercel project settings → Domains |
| Update DNS at registrar | Small | Add Vercel's A record (`76.76.21.21`) + CNAME (`cname.vercel-dns.com`) for `www` |
| Verify SSL certificate issued | Small | Vercel provisions Let's Encrypt automatically |
| Smoke-test production domain | Small | Nav, content, video, both languages |
| DNS cutover (nikart.co.uk → Vercel) | Small | After verification period; legacy Heroku still live during propagation |
| Legacy cleanup commit | Small | Remove legacy files, promote `modern/` to root |
| Decommission Heroku app | Small | After DNS propagation confirmed (check with `dig nikart.co.uk`) |

**Step effort: ~1 session**

---

## Effort Summary

| Step | Estimated Sessions | Dependency |
|------|-------------------|------------|
| 4. Project Setup & Architecture | 1 | — |
| 5. Data Layer & Content Types | 1 | Step 4 |
| 6. Layout & Navigation Shell | 2 | Step 5 |
| 7. Content Views | 2 | Step 6 |
| 8. Animation & Transitions | 2–3 | Step 7 |
| 9. Polish & Verification | 1–2 | Step 8 (parallel with Step 10) |
| 10. WIP Deploy to Vercel Preview | Ongoing | Step 8 (**current**) |
| 11. Production Cutover | 1 | Steps 9 + 10 |
| **Total** | **10–12 sessions** | |

A "session" = one focused working block with AI agent collaboration.

---

## Cloud Agent Dev Environment

- `.cursor/environment.json` (2026-09-07): repo-managed Cloud Agent environment on the default image (Node 22 preinstalled).
  - `install`: `npm install && npm install --prefix modern` — installs legacy (root) and modern deps; modern `postinstall` copies the Ruffle runtime and syncs `public/content/img` → `modern/public/_generated/img`.
  - `terminals`: `modern` (`npm run modern`, Next.js dev on :3000) and `legacy` (`npm start`, Express/Swig on :5000).
  - `ports`: 3000 (modern) and 5000 (legacy) exposed.
  - Validated: lint clean, 59 unit tests passing, production build clean, both dev servers serve (`/en`, `/es`, and legacy `/html5/`).

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

1. **AGENTS.md at repo root** — Workspace agent rules; documents that `modern/` is the main app and the one-word run command `npm run modern`.
2. **AGENTS.md at `modern/` root** — Describes project structure, commands, patterns, and constraints for AI agents.
3. **README.md** — Human-readable setup and architecture overview.
4. **Inline comments only for "why"** — Code should be self-documenting. Comments explain non-obvious decisions only.

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
| Scope creep (redesign temptation) | Step 8 is about faithful reproduction; any redesign is a separate future step |
| Agent-generated code quality | Strict TypeScript + ESLint + pre-commit hooks catch issues immediately |
