# Legacy App Analysis

## 1. Architecture Overview

### Server Layer
- **Runtime:** Node.js (22.x) with Express 4.18
- **Templating:** Swig 1.1 (unmaintained since 2015, no longer developed)
- **Static files:** Served from `public/` via `express.static`
- **Middleware:** `compression`, `cookie-parser`
- **Deployment:** Heroku (Procfile with `web: node server.js`)

### Routes

| Route | Controller | Purpose |
|-------|-----------|---------|
| `/` | index | Redirects to `/html5` |
| `/en`, `/es` | index | Set language cookie, redirect to `/` |
| `/html5` | html5 | Main HTML5 portfolio app (SSR template) |
| `/html5/:lang` | html5 | Set language, redirect to `/html5` |
| `/fl` | fl | Flash version (defunct) |
| `/fl/:lang` | fl | Set language, redirect to `/fl` |

### Data Flow
1. **Language:** Detected from cookie → `Accept-Language` header → defaults to `en`. Stored as a cookie (`langcode`).
2. **Portfolio data:** Static JSON file (`public/content/json/data.json`) fetched by client-side Backbone model.
3. **Client routing:** Backbone.Router with hash-based navigation (`#idStr`). Routes resolve to nested menu items in the JSON tree via recursive search.
4. **State management:** Single `AppModel` (Backbone.Model) holds screen dimensions, current path array, current item, and references to `JSONModel`. No external state library.
5. **Event bus:** `events/vent.js` (Backbone.Events) coordinates view open/close rather than a single declarative render tree.

### App Boot Flow
1. `html5.html` (Swig) renders the shell and injects `window.nikart.langCode`, `window.nikart.staticFilesStr`, and optional `window.nikart.debug`.
2. RequireJS loads `main.js`, which creates `AppRouter` and `AppView`.
3. `AppView` creates `AppModel`.
4. `AppModel` fetches `data.json`.
5. On data load, `AppModel` triggers `ventInitDataLoaded`.
6. `AppView` instantiates article, video, thumbnail, breadcrumb, and nav views.
7. Backbone.history starts and hash routes drive the selected content item.

### View Responsibilities

| View | Responsibility |
|------|---------------|
| `AppView` | Creates global model, child views, scroll/resize/orientation listeners |
| `NavView` | Opens/closes menu, draws nav canvas bezier shape, animates nav items |
| `NavItemView` | Renders and animates individual nav rows with curved stagger |
| `ThumbView` | Renders item thumbnails, filters `html5` item, animates thumbnail panel |
| `ThumbItemView` | Scroll-triggered thumbnail animation with queued GSAP timings |
| `ArticleView` | Renders text/web/image items and image slideshow |
| `VideoView` | Renders jPlayer video player with H.264/WebM sources |
| `BreadcrumbsView` | Renders breadcrumb HTML from `pathArr` (string-built, not escaped) |

### Content Structure (data.json)
- Nested tree: `main → menu[] → submenu[]`
- Top-level menu items: 7, maximum nested depth: 3
- Item types: `main` (1), `men` (menu, 8), `web` (27), `tex` (text-only, 14), `ima` (image gallery, 1), `vid` (video, 29)
- Bilingual: `en`/`es` strings per item field
- ~80 portfolio items across 6 categories
- Multilingual fields and type-specific optional fields are implicit (no schema/validation)

---

## 2. Frontend Stack (HTML5 Version)

| Layer | Technology | Version |
|-------|-----------|---------|
| Module loader | RequireJS | ~2.1.8 |
| MV* framework | Backbone.js | ~1.0.0 |
| Utility | Underscore.js | ~1.5.2 |
| DOM | jQuery | ~2.0.3 |
| Animation | GSAP (TweenLite + CSSPlugin) | ~1.10.3 |
| Video | jPlayer (jQuery plugin) | ~2.4.1 |
| Templates | Underscore `_.template()` + RequireJS text plugin | — |
| CSS preprocessing | Sass (via Grunt + Compass) | — |
| CSS reset | normalize-scss | ~2.1.2 |
| Build tool | Grunt | ~0.4.1 |
| Package mgmt (client) | Bower | — |

---

## 3. Animation Inventory

### GSAP (TweenLite) — Primary Animation Engine

| Component | Animation | Properties |
|-----------|-----------|-----------|
| **Nav view** | Menu open/close | `left`, `top` positioning; staggered item fade-in via `delayedCall` |
| **Nav canvas** | Growing circle reveal | Canvas 2D arc drawing on `requestAnimationFrame`-style loop via `delayedCall` |
| **Nav items** | Curved stagger in/out | `fadeTo` + jQuery width animation + margin-left curve calculation |
| **Thumb view** | Slide in/out from right | `right` property tween |
| **Thumb items** | Fade + scale entrance | `autoAlpha`, `scale` with staggered delays |
| **Article view** | Fade in/out | `autoAlpha` from 0→1 / 1→0 |
| **Video view** | Fade in/out | `autoAlpha` from 0→1 / 1→0 |
| **Slideshow** | Cross-fade images | `autoAlpha` on stacked `<li>` elements |

### Canvas 2D
- **Nav shape:** Draws a filled/stroked bezier shape on `<canvas width="130" height="260">` — triggered on nav open, animated as a DOM element via TweenLite after drawing.
- No Three.js, PixiJS, or broad canvas rendering engine is present.

### CSS Transitions
- Sass `@mixin transitionMix(all, 0.3s)` used on:
  - Nav item hover states
  - Thumb label/image hover states
  - Article link hover states
  - Button hover states

### Sprite Animation
- **Thumb item sprites:** Frame-by-frame CSS sprite animation (`anitest` folder), toggled by class names (`anitest-fr-0001` etc.). Currently **disabled** (`isUsingSpriteAni = false`).

### Legacy Flash (Defunct)
- `public/fl/main.swf` — ActionScript 2/3 with GreenSock `TweenMax`
- Source: `src/fl/main.fla` + GreenSock AS3 classes
- Non-functional in modern browsers

---

## 4. Tech Debt & Migration Complexity

### Critical Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| **Swig templating** | 🔴 High | Unmaintained since 2015, known security issues |
| **Bower** | 🔴 High | Deprecated, no longer maintained |
| **Backbone.js** | 🟠 Medium | Effectively abandoned, last release 2022 |
| **RequireJS** | 🟠 Medium | Superseded by ES modules / bundlers |
| **jQuery 2.x** | 🟠 Medium | EOL, no security patches |
| **GSAP 1.x** | 🟡 Low | Works but very outdated (current is v3.x with different API) |
| **jPlayer** | 🟠 Medium | jQuery plugin, unmaintained; HTML5 `<video>` is native now |
| **Grunt** | 🟡 Low | Functional but superseded by modern bundlers |
| **No tests** | 🔴 High | Zero test coverage |
| **No TypeScript** | 🟡 Low | All vanilla JS with `'use strict'` |
| **No linting config** | 🟡 Low | Only JSHint in Grunt, no modern ESLint |
| **Hardcoded static URL** | 🟠 Medium | `http://static.nikart.co.uk` embedded in model |
| **Non-HTTPS URLs** | 🟠 Medium | Production templates include `http://` external URLs |
| **Cookie-based i18n** | 🟡 Low | Works but not SEO-friendly |
| **Modernizr/IE conditionals** | 🟡 Low | Unnecessary for modern browsers |
| **Viewport user-scalable=no** | 🟡 Low | Accessibility issue, prevents zoom |
| **Mixed ES5/ES6** | 🟡 Low | `const` appears in otherwise ES5-style code |
| **Breadcrumb XSS surface** | 🟡 Low | Breadcrumb HTML is string-built, not structurally escaped |

### Complexity Assessment

| Component | Migration Effort | Rationale |
|-----------|-----------------|-----------|
| Express server + routes | **Low** | Simple redirect logic, easily replaced by framework routing |
| Data layer (JSON) | **Low** | Static JSON, can be imported as-is or moved to CMS |
| Backbone views → React components | **Medium** | 8 views to convert; logic is straightforward but tightly coupled to Backbone events |
| GSAP animations | **Medium** | 8 animation sequences; GSAP 3 or Framer Motion have different APIs but concepts map well |
| Canvas nav animation | **Low** | Small isolated canvas drawing (~30 lines), easy to port |
| Video player (jPlayer) | **Low** | Replace with native `<video>` element or modern player |
| Sass styles | **Low** | Can be migrated to CSS Modules / Tailwind / kept as Sass |
| i18n system | **Low** | Simple key-value lookups, easily replaced with i18next or similar |
| Sprite animations | **Low** | Currently disabled; can be reimplemented with CSS animations or Lottie |
| Responsive breakpoints | **Low** | Standard breakpoint system, maps to modern CSS or framework utilities |

---

## 5. Styling & Layout

- Sass source: `public/html5/app/styles/sass/` with Compass and old Bootstrap Sass dependencies
- Built CSS exists in both `app/styles/css/main.css` and `dist/styles/css/main.css`
- Responsive breakpoints are duplicated: defined in both Sass variables and JavaScript (`AppModel.defaults`)
- Viewport is locked: `maximum-scale=1.0, user-scalable=no` (accessibility concern)
- Much layout is calculated imperatively in views using jQuery `.outerHeight()`, `.css()` and manual centering
- `debug` mode toggles between `app/` and `dist/` asset roots via Swig template conditional

---

## 6. Build & Dependency Health

### Root package
- `npm start` → `node server.js`
- `npm test` → `forever /usr/local/bin/node-inspector --web-port=9999` (not a real test suite)
- `npm restart` → `supervisor --debug server.js` (`supervisor` is not declared as a dependency)
- `engines` pins Node 22 and npm 10

### HTML5 sub-package (`public/html5/`)
- `npm start` → `grunt`
- `npm run watch` → `grunt watch`
- Grunt tasks: Compass Sass compile, RequireJS bundle, uglify, copy assets
- All dependencies are unmet in the current checkout (not installed)

---

## 7. File Statistics

| Category | Count |
|----------|-------|
| Server-side JS files | 4 |
| Client JS modules | 17 |
| Sass partials | 12 |
| HTML templates (Swig) | 4 |
| HTML templates (Underscore) | 4 |
| Portfolio items in JSON | ~80 |
| Total lines of JS (estimated) | ~1,500 |
| Total lines of Sass (estimated) | ~400 |

---

## 8. Assets & External Dependencies

- **Images:** `public/content/img/` — portfolio screenshots (referenced by ID in JSON)
- **Videos:** Hosted externally at `http://static.nikart.co.uk` (H.264 + WebM formats, non-HTTPS)
- **Sprites:** `public/html5/app/img/sprites/` — curl animation, test animation frames
- **Flash SWF:** `public/fl/main.swf` + `src/fl/main.fla` and ActionScript/GreenSock AS3 classes
- **PHP files:** `src/php/` — historical JSON-generation code, uses removed `mysql_*` PHP APIs, not connected to current Express app
- **Analytics:** Classic Google Analytics (`ga.js`, account `UA-11548511-1`)
- **External static domain:** `http://static.nikart.co.uk` — availability/accessibility unverified
