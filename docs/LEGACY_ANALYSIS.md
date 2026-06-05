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
3. **Client routing:** Backbone.Router with hash-based navigation (`#idStr`). Routes resolve to nested menu items in the JSON tree.
4. **State management:** Single `AppModel` (Backbone.Model) holds screen dimensions, current path array, current item, and references to `JSONModel`. No external state library.

### Content Structure (data.json)
- Nested tree: `main → menu[] → submenu[]`
- Item types: `main`, `men` (menu), `web`, `tex` (text-only), `ima` (image gallery), `vid` (video)
- Bilingual: `en`/`es` strings per item field
- ~70 portfolio items across 6 categories

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
- **Nav circle reveal:** Draws expanding arc on a `<canvas width="130" height="260">` using `context.arc()` — triggered on nav open.

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
| **Cookie-based i18n** | 🟡 Low | Works but not SEO-friendly |
| **Modernizr/IE conditionals** | 🟡 Low | Unnecessary for modern browsers |

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

### Overall Migration Complexity: **Medium**

The app is a classic single-page portfolio with well-separated concerns. The main challenges are:
1. Converting 8 Backbone views + event bus to a modern component architecture
2. Reproducing GSAP animation sequences with equivalent fidelity
3. Preserving the bilingual content system

The data model (nested JSON tree with route-based navigation) is clean and can be consumed directly by a modern framework.

---

## 5. File Statistics

| Category | Count |
|----------|-------|
| Server-side JS files | 4 |
| Client JS modules | 17 |
| Sass partials | 12 |
| HTML templates (Swig) | 4 |
| HTML templates (Underscore) | 4 |
| Portfolio items in JSON | ~70 |
| Total lines of JS (estimated) | ~1,500 |
| Total lines of Sass (estimated) | ~400 |

---

## 6. Assets & External Dependencies

- **Images:** `public/content/img/` — portfolio screenshots (referenced by ID in JSON)
- **Videos:** Hosted externally at `static.nikart.co.uk` (H.264 + WebM formats)
- **Sprites:** `public/html5/app/img/sprites/` — curl animation, test animation frames
- **Flash SWF:** `public/fl/main.swf` (can be archived/removed)
- **PHP files:** `src/php/` — legacy database scripts, not connected to current Express app

---

## 7. Recommendations for Migration

1. **Drop entirely:** Flash version, Bower, RequireJS, Swig, jPlayer, Modernizr, IE conditionals, PHP files
2. **Preserve:** JSON data structure, GSAP animation timings/easing, responsive breakpoints, bilingual content
3. **Modernise:** GSAP 1.x → GSAP 3 or Framer Motion, Backbone → React/framework components, jQuery → native DOM
4. **Add:** TypeScript, ESLint, testing framework, proper i18n library, native `<video>`
