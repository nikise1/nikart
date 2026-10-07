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
- [x] Content JSON: one pretty-printed git copy at repo-root `public/content/json/data.json`; install/build minifies it into `modern/public/content/json/data.json` (gitignored). Next imports the pretty repo-root file (2026-10-06)
- [x] Removed the in-app `/dev/content` editor. `npm run json:edit` prints a JSON Editor Online link with the portfolio file already loaded (2026-10-06)
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
- [x] Staggered notch drop from the page top (rest at `-0.3em`); only new crumbs enter; removed crumbs reverse-exit (`use-breadcrumb-animator.ts`)
- [x] One click navigates — current crumb is not a link, exiting crumbs stay clickable, view-transition snapshots ignore pointer events
- [x] Small screens: ellipsis on ancestor labels (8rem cap); current title uses the leftover width and ellipsizes only if the strip is still too narrow (2026-10-06)

#### 9b3: Language switcher
- [x] Fixed bottom-left, `{{otherversions}}` interpolation

#### 9b4: Dev ergonomics
- [x] `data-component` attributes on all components

#### 9c: Nav fidelity
- [x] Matches legacy positioning, animation, and timing
- [x] `whitespace-nowrap` prevents line wrapping
- [x] Nav animation phase state machine in Zustand (`nav-store.ts`) — startup close-then-open, item stagger, canvas/button sequencing, deferred route navigation on item click
- [x] Central `useNavAnimator` orchestrator mirrors legacy `nav-view.js doAni()` (single tween scope, kill on interrupt)
- [x] NavButton is back-to-main only — hidden on home, shown off main, click reverses the enter tween then navigates to `/`; extra clicks are ignored only while that tween is running so the button cannot stick unclickable after a later reveal

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
- [x] `/fl/en` and `/fl/es` redirects set locale cookie (legacy parity; explicit paths so they cannot steal `/fl/main.swf`)
- [x] Unit tests for `flash-config` helpers
- [x] Fix blank SWF: serve `data.json`, Ruffle `base` URL, `window.nikart` bridge, AS2 player settings
- [x] Fix empty `#swf_container`: self-host Ruffle at `/ruffle/ruffle.js` (CDN path `/dist/ruffle.js` was 404)
- [x] Remove lizard tongue chord in Ruffle: copy `modern/public/fl/main.swf` to `main.ruffle.swf` and edit only that copy (two open `curveTo` strokes with `moveTo(0,0)` before each); `/fl` loads the copy so the Animate export stays untouched
- [x] Document current Ruffle preview + options for Flash on `static.nikart.co.uk` (`docs/RUFFLE_PREVIEW.md`, 2026-09-15)
- [x] Add AwayFL as a dual-player option for S3 Away3D / AS3 (keep Ruffle on `/fl`)
- [x] Mock AwayFL popup for static Flash (`/fl/away`, `/static` proxy, Claro first; same HTML→SWF path for games/banners/websites/3d). Vendored AVM2 ABC catalogs that npm omits.
- [x] Temporary local SWF compare kit: one HTML page per SWF with generic Ruffle + AwayFL players (Ruffle autoplay on); menu/popWin open `/swf-compare/` (2026-09-15)
- [x] Commit `/swf-compare/pieces/` SWFs and sidecars so the Vercel preview can live-play them (2026-09-22)
- [x] Commit Ruffle + AwayFL runtimes (`public/ruffle`, `public/awayfl`) so compare pages work on Vercel, not just locally (2026-09-22)
- [x] Fit AwayFL to the pane (viewport = column size, not SWF pixels / `100%` of the window) so compare stages match Ruffle (2026-09-22)
- [x] Keep compare `.stage` height with SWF `aspect-ratio` so AwayFL `position:absolute` canvas is not clipped; pass pane CSS pixels as `w`/`h` (2026-09-22)
- [x] Copy child SWFs/XML sidecars for compare pages (resolve Loader URLs from the SWF directory, not the XML file) (2026-09-24)
- [x] Copy JPEG sidecars the SWFs load at runtime (`img/fin_del_juego.jpg`, Escalera `img/p_{n}/{i}.jpg`, DAE textures) (2026-09-24)
- [x] Load compare-kit movies from `static.nikart.co.uk` through `/static` so child files come from the origin (2026-09-24)
- [x] Proxy `/static` with a Node route handler so Vercel preview can fetch the HTTP origin (2026-09-24)
- [x] Drop the `next.config` `/static` rewrite so Vercel cannot bypass the Node proxy (HTTPS preview was still blank) (2026-09-24)
- [x] Switch compare-kit movies back to `/swf-compare/pieces/{id}/` copies after the origin `/static` proxy still failed on Vercel (2026-09-24)
- [x] Add the legacy lizard Flash site (`/fl/main.swf`) to the compare kit in both Ruffle and AwayFL (2026-09-27)
- [x] Link the compare index topnav and intro note to `/swf-compare/pieces/lizard-site/` (2026-09-28)
- [x] Stop Safari aborting lizard `main.swf` on the compare page: drop document `<base href="/fl/">`, load the pieces copy, share one SWF fetch, start AwayFL after Ruffle, pin `/fl/en` and `/fl/es` so they cannot capture `/fl/main.swf`, rewrite `/swf-compare/pieces/content/` to `/content/` for AwayFL (2026-09-28)
- [x] Point AwayFL lizard LoadVars `../content/json/data.json` at `/content/` (AwayFL logs that relative URL against the compare HTML page, so `_root.dataLoaded` stayed false) (2026-09-28)
- [x] Rebase the compare kit onto master and load the lizard movie from `main.ruffle.swf` (same Ruffle tongue-chord copy as `/fl`) instead of the Animate `main.swf` export (2026-09-29)
- [x] Host-side AwayFL LoadVars `onData` patch in `modern/public/awayfl/loadvars-ondata-patch.js` (prototype slot was READ_ONLY so the lizard’s JSON `onData` override was dropped); notes for an upstream `awayfl/avm1` PR in `docs/AWAYFL_LOADVARS.md` (2026-09-29)
- [x] Compare-kit index cards and piece topnav prev/next follow `swf-compare-catalog.json` order (they used two different A–Z sorts) (2026-09-29)
- [x] Compare-kit per-page Ruffle/AwayFL visibility in `localStorage` (`swf-compare-pages`); committed defaults in `visibility-defaults.json`; Hide/Show next to each player; index card flags are clickable (2026-09-29)
- [x] Compare-kit movies load from `https://static.nikart.co.uk` (CloudFront HTTPS + CORS); lizard stays on `/fl/main.ruffle.swf`; piece binaries are gitignored (2026-10-05)
- [x] Fix Vercel `noUnusedLocals` on `originMoviePath(id)` so the HTTPS-origin compare-kit build can deploy (2026-10-05)
- [x] Move compare pages to `/swf-compare/{id}/` and delete `public/swf-compare/pieces/` (2026-10-05)
- [x] Gitignore generated `public/ruffle/` and `public/awayfl/` copies (keep `loadvars-ondata-patch.js`; `postinstall`/`prebuild` restore the runtimes) (2026-10-05)
- [x] Fix `docs/diagrams/*.svg` encoding (invalid XML control chars / bare `&`) and HTTPS+CORS labels (2026-10-05)
- [x] Drop leftover `/swf-compare/pieces/` aliases (rewrite, LoadVars remap, movie-path strip, visibility id parser) (2026-10-05)
- [x] Size compare stages from each SWF header, not the `data.json` popup window or the stretched column. Avis is 500×500 (window was 600×600); banners use their own stage (300×250, 728×90, and so on) (2026-10-06)
- [x] Compile compare HTML and a full-window fill page per movie from `modern/public/swf-compare/pages.json` (gitignored outputs; fill background is the legacy embed color) (2026-10-06)
- [x] Portfolio launch buttons and `popWin` open `/swf-compare/{id}/fill.html` (2026-10-06)
- [x] Stop AwayFL stretching a 300×150 bitmap to the CSS stage: set the stage size twice so both canvas axes update (2026-10-06)
- [x] Compare index/piece links are root-absolute; redirect `/swf-compare` → `/swf-compare/index.html` so cards work without `/index.html` (2026-10-06)
- [x] Fill pages and `/fl` stretch into a viewport-sized box clipped to the SWF stage aspect ratio (`exactFit`), so off-stage content is masked (2026-10-06)
- [x] `/fl` overrides root `globals.css` portfolio background with `!important` black (same as `/fl/away`) so letterbox regions stay black (2026-10-06)
- [x] Remove `/fl` `fl-fallback` links and the shared `fl-fallback` class (2026-10-06)
- [x] `/fl` Ruffle uses `autoplay: "on"` + `unmuteOverlay: "hidden"` like compare fill pages; pause/stop media on unmount and when Ruffle detaches video nodes (2026-10-06)
- [x] HTML5 `VideoView` pauses its `<video>` on unmount so leave transitions do not keep audio playing (2026-10-06)
- [x] Abort leaked Ruffle FLV NetStream audio after leaving a Flash video view: track `video_flv` fetch + Web Audio buffer sources and stop them when Back keeps the decoder pumping (2026-10-07)

#### 9g: Slideshow interaction ✅ (2026-09-07)

- [x] Extract `Slideshow` from `ArticleView` (`src/components/slideshow/slideshow.tsx`)
- [x] Swipe left/right to change slides (pointer events, 48px threshold)
- [x] Hover zones: left/right thirds show gradient arrows and click prev/next (no pause); middle third pauses with a two-bar glyph
- [x] Centre click toggles sticky play/pause (hovering the middle then clicking locks pause; a second click plays even while still hovering)
- [x] Left/right click flashes arrows then fades them on all devices, including desktop hover
- [x] Progress `n / total` centred under the images, clickable to advance
- [x] Colocated unit tests for arrows, swipe, pause zones, progress click, and single-image mode

#### 9j: Mobile article heading width ✅ (2026-10-06)

- [x] Article and video `h1` elements stay `text-2xl` (1.5rem / 24px, line-height 2rem).
- [x] Below `md`, the heading is `calc(100% - 5.5rem)` wide and aligned to the end. The closed menu curl is 90px wide at `left: 0`, and this inset clears it, including at 641px where `sm` had already restored a full centered line.
- [x] From `md` (768px) up the heading is full width and centered. Thumbnail row height and list gap stay as they were.

#### 9i: Article and video enter/exit ✅ (2026-10-06)

- [x] Legacy fades the whole article or video panel (`timeArticleOut` 0.5s, `timeArticleIn` 1.5s). Modern only faded the panel in over 0.4s, so leaving it cut.
- [x] Title, slideshow or player, description, and launch link each leave and arrive on their own. Leave is 240ms, each next block starts 40ms later (about 360ms for a full article). Arrival starts 60ms in, same stagger. Shorter than the legacy fade-in.
- [x] These blocks are not inside the thumbnail route transition, so the page slide does not replace the content fade.
- [x] `prefers-reduced-motion` still zeros the animation.

#### 9h: Breadcrumb entrance animation ✅ (2026-09-10)

- [x] Image notches (`stump.png`) drop in from above the page top, staggered with nav `staggerIn`
- [x] Labels unmask via `clip-path` inset (left-to-right, 0.75s) so crumb slots stay put
- [x] Only newly added crumbs enter; removed crumbs mask out then the notch moves up
- [x] Notch rest matches the original slightly-negative Y (`-0.3em`)
- [x] Hidden while nav is open; trail lives in Zustand so view-transition remounts still add/exit only the changed suffix
- [x] Rendered outside the `site-header` view-transition group so the entrance is not frozen on navigation

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
| 2026-10-05 | Gitignore generated Ruffle/AwayFL copies | `postinstall`/`prebuild` already copy them; keep the LoadVars patch and vendored ABC catalogs |
| 2026-10-05 | Restore `docs/diagrams/*.svg` to UTF-8 | Files were invalid XML (C0 control chars, bare `&`) and still said HTTP S3 / no CORS |
| 2026-10-06 | Agents paste the Vercel branch preview URL | Root `AGENTS.md`: after push, the summary includes the stable preview from the PR’s Vercel comment, not `nikart-beta.vercel.app` |
| 2026-10-06 | One branch per chat | Root `AGENTS.md`: follow-up work in the same conversation stays on the chat’s existing branch |
| 2026-10-06 | Compile SWF compare pages from `pages.json` | The HTML files were copies of one template; gitignore the output and generate a full-window fill page per movie |
| 2026-10-06 | Fill/`/fl` clip to stage aspect ratio | Stretching the player to the full viewport showed off-stage content; mask to native ratio with `exactFit` |
| 2026-10-06 | Absolute `/swf-compare/…` hrefs + redirect | Relative index cards broke when the URL was `/swf-compare` without `/index.html` |
| 2026-10-06 | One pretty-printed git copy of portfolio JSON at repo-root `public/content/json/data.json` | Flash still requests `/content/json/data.json`, so install/build minifies that file into the Next public path |
| 2026-10-06 | Edit portfolio JSON in JSON Editor Online | `npm run json:edit` loads the file via the site’s `#left=json.` hash. Saying “edit json data” in a chat follows root `AGENTS.md` |
