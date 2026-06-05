# Legacy Analysis

Step 1 deliverable for the Nikart legacy-to-modern migration.

## Executive Summary

Nikart is a legacy portfolio site with a thin Node/Express server, Swig-rendered entry pages, and a substantial static HTML5 app built with RequireJS, Backbone, Underscore templates, jQuery, jPlayer, TweenLite/GSAP, Sass/Compass, Grunt, and Bower-era vendored dependencies. The modern migration target should treat the existing HTML5 app as the canonical product experience; the Flash and PHP code are archival references.

The content model is favorable for migration because most portfolio structure is already centralized in `public/content/json/data.json`. The main migration challenge is not business logic volume; it is preserving interaction fidelity across custom view orchestration, hash routes, animation timing, responsive positioning, image slideshows, video playback, and legacy static asset paths.

## Repository Shape

| Area | Purpose | Notes |
| --- | --- | --- |
| `server.js` | Express app bootstrap | Serves `public`, configures Swig, compression, cookie parser, and registers route controllers. |
| `app/controllers` | Server routes | Root redirects to `/html5`; `/en` and `/es` set language cookie; `/fl` still renders Flash fallback. |
| `app/views` | Swig templates | `html5.html` is the real app shell; `fl.html` and `index.html` are Flash-era shells. |
| `app/models/appModel.js` | Server-side helpers | Language detection/cookie handling and static asset base URL logic. |
| `public/html5/app` | Source HTML5 client app | Backbone/RequireJS source, Sass, templates, Bower components, app images. |
| `public/html5/dist` | Built HTML5 client app | Optimized JS/CSS and copied runtime assets used outside debug mode. |
| `public/content` | Portfolio content assets | JSON data and many image assets. |
| `public/fl` and `src/fl` | Flash runtime/source | SWF runtime and ActionScript/FLA sources. Modern browsers cannot run this directly. |
| `src/php` | Historical data-generation code | Marked unused; uses removed `mysql_*` PHP APIs. |
| `docs/MIGRATION_OVERVIEW.md` | Migration outline | Defines this Step 1 audit and subsequent planning steps. |

## Server Runtime

The Node server is intentionally small:

- `GET /` redirects to `/html5`.
- `GET /en` and `GET /es` set a `langcode` cookie and redirect to `/`.
- `GET /html5` renders the HTML5 shell with `langCode`, `staticFilesStr`, `menuStr`, and optional debug mode.
- `GET /html5/:lang` sets the language cookie and redirects to `html5`.
- `GET /fl` renders the Flash shell.
- `GET /fl/:lang` sets the language cookie and redirects to `fl`.

Runtime dependencies are:

- `express@^4.18.2`
- `compression@^1.7.4`
- `cookie-parser@^1.4.6`
- `swig@~1.1.0`

Important server observations:

- `swig` is abandoned and should be removed during modernization.
- `app.set('view cache', false)` and `swig.setDefaults({ cache: false })` are always disabled, despite a source comment warning not to do that in production.
- Static assets are served from `./public`.
- The server-side model hard-codes production static files to `http://static.nikart.co.uk`, while development uses `../static`.
- Language persistence is cookie-based and simple enough to replace with URL params, locale routes, or client-side preference storage.
- The app still includes classic Google Analytics `_gaq` tracking.

## HTML5 Client Architecture

The HTML5 app is the central migration source.

### Module System And Frameworks

- RequireJS loads AMD modules from `public/html5/app/scripts/main.js`.
- Backbone provides models, views, collections, and hash routing.
- Underscore renders HTML templates.
- jQuery is used for DOM selection, mutation, dimensions, events, and jPlayer.
- TweenLite/GSAP performs most animations.
- jPlayer handles video playback and still contains Flash fallback assumptions.

### App Boot Flow

1. `app/views/html5.html` renders the shell and injects `window.nikart.langCode`, `window.nikart.staticFilesStr`, and optional `window.nikart.debug`.
2. RequireJS loads `public/html5/app/scripts/main.js`.
3. `main.js` creates `AppRouter` and `AppView`.
4. `AppView` creates `AppModel`.
5. `AppModel` fetches `public/content/json/data.json`.
6. When data loads, `AppModel` triggers `ventInitDataLoaded`.
7. The app instantiates article, video, thumbnail, breadcrumb, and nav views.
8. Backbone history starts and hash routes drive the selected content item.

### Routing And State

Client routing is hash-based:

- Empty route maps to `main`.
- Any other hash is treated as an item id.
- Navigation events call `router.navigate(id, { trigger: true })`.
- The selected item is derived by recursively searching the loaded JSON tree.

State is concentrated in `AppModel`:

- Current content item: `curItem`
- Navigation path: `pathArr`
- Featured menu behavior: `isFeaturedMenu`
- Responsive state: `screenCode`, `orientation`, dimensions
- Data model: `jsonModel`
- Router reference
- Thumbnail animation queue: `thumbsToAnimateArr`

The event bus in `events/vent.js` coordinates view opening/closing rather than having a single declarative render tree.

### Content Model

`public/content/json/data.json` is the canonical content source.

Observed content summary:

- Top-level menu items: 7
- Maximum nested menu depth: 3
- Item type counts:
  - `main`: 1
  - `men`: 8
  - `web`: 27
  - `tex`: 14
  - `vid`: 29
  - `ima`: 1

Migration implication: this should become typed content data early, ideally with validation. The existing schema is small enough to model directly, but multilingual fields and type-specific optional fields need explicit types.

### View Responsibilities

| View | Current responsibility | Migration complexity |
| --- | --- | --- |
| `AppView` | Creates global model, child views, scroll/resize/orientation listeners | Medium: replace global event orchestration with app state and effects. |
| `NavView` | Opens/closes menu, draws nav canvas shape, animates nav items | High: custom canvas and staggered timing should be preserved or intentionally redesigned. |
| `NavItemView` | Renders and animates individual nav rows | Medium. |
| `ThumbView` | Renders item thumbnails, filters `html5`, animates thumbnail panel | Medium. |
| `ThumbItemView` | Lazy-ish thumbnail animation on scroll visibility | High: scroll visibility, queued GSAP timings, transform/opacity behavior. |
| `ArticleView` | Renders text/web/image items and slideshow | Medium-high: slideshow object is mutable singleton-like state. |
| `VideoView` | Renders jPlayer video player | Medium-high: jPlayer replacement and media asset availability need verification. |
| `BreadcrumbsView` | Renders breadcrumb HTML from `pathArr` | Low. |

## Animation Inventory

Primary animation dependency: TweenLite/GSAP.

Key animation surfaces:

- Nav open/close:
  - `NavView` moves the canvas and menu button.
  - `NavItemView` animates item widths with staggered delays.
  - Nav canvas shape is redrawn in `NavView.setUpCanvas()`.
- Thumbnail panel:
  - `ThumbView` animates `.thumb-list` from `right: -300` to `right: 0`.
  - `ThumbItemView` scales/fades images when items enter the viewport.
  - There is an inactive sprite-animation path controlled by `isUsingSpriteAni = false`.
- Article transitions:
  - `ArticleView` fades content in/out.
  - `utils/slideshow.js` cycles article images with delayed calls and fade transitions.
- Video transitions:
  - `VideoView` fades the jPlayer content in/out.
- Scroll handling:
  - `AppView` emits `ventScrolling` and debounced `ventScrollingStopped`.
  - Thumbnail reveal behavior is tied to scroll-stop events.

Canvas usage is limited and isolated to the navigation flourish:

- `<canvas width="130" height="260" class="nav-canvas">`
- Draws one filled/stroked bezier shape.
- Animated with TweenLite as a DOM element after drawing.

No Three.js, PixiJS, or broad canvas rendering engine is present.

## Styling And Layout

- Sass source lives under `public/html5/app/styles/sass`.
- Built CSS exists in both `app/styles/css/main.css` and `dist/styles/css/main.css`.
- Build uses Compass and old Bootstrap Sass dependencies.
- Responsive breakpoints are duplicated in JavaScript and Sass concepts.
- The viewport is locked with `maximum-scale=1.0, user-scalable=no`.
- A lot of layout is calculated imperatively in views using jQuery dimensions and CSS mutation.

Migration implication: preserve layout behavior via a focused visual regression pass before replacing imperative sizing. Expect some fragile mobile/orientation behavior.

## Build And Dependency Health

Root package:

- `npm start` runs `node server.js`.
- `npm test` points to `forever /usr/local/bin/node-inspector --web-port=9999`, which is not a test suite.
- `npm restart` uses `supervisor --debug server.js`, but `supervisor` is not declared.
- `engines` pins Node 22 and npm 10.

HTML5 package:

- `npm run start` runs `grunt`.
- `npm run watch` runs `grunt watch`.
- Grunt build tasks compile Compass Sass, RequireJS bundle, uglify RequireJS, and copy assets.
- Build tooling is old: Grunt 0.4, Compass, Bower-era vendored libraries.

Current checkout status:

- `npm ls --depth=0` reports all root dependencies as unmet.
- `npm ls --depth=0` under `public/html5` reports all Grunt dev dependencies as unmet.
- No runtime/build verification was performed because dependencies are not installed in the checkout.

## Flash And PHP Legacy Areas

Flash:

- `/fl` still renders a SWF using SWFObject.
- `public/fl/main.swf` is present.
- `src/fl/main.fla` and ActionScript classes are present.
- Modern browsers cannot run Flash, so this should be treated as reference material only.

PHP:

- `src/php/get_data.php` states the PHP code is unused and was formerly used to generate JSON.
- `src/php/database.php` uses PHP `mysql_*` APIs, which were removed in modern PHP.
- This code should not be migrated as runtime code unless there is a separate content-editing requirement.

## External Assets And Integrations

- Production video/static URLs are expected under `http://static.nikart.co.uk`.
- Image/content URLs are local under `public/content`.
- Classic Google Analytics uses `ga.js` and account `UA-11548511-1`.
- Flash download links and fallback messaging remain in templates.
- jPlayer video expects H.264 and WebM paths derived from the content item id.

Migration implication: verify the external static domain and video files before committing to the new media architecture. The image assets are local and easier to preserve.

## Tech Debt And Risks

Highest migration risks:

1. Animation fidelity: GSAP timings and view orchestration are spread across several modules.
2. Video playback: jPlayer and external static video paths may not work reliably without verifying the media host.
3. Build reproducibility: old Grunt/Compass/Bower tooling and absent installed dependencies make the current build fragile.
4. Runtime dependencies: Swig is abandoned, Flash is obsolete, PHP code is unusable on modern PHP.
5. State coupling: global event bus plus mutable model/view state makes behavior implicit.
6. Responsive behavior: JavaScript-driven layout and orientation handling may hide edge cases.
7. Content typing: JSON schema is implicit, multilingual fields are inconsistent enough to warrant validation.
8. Security/content hygiene: templates mostly use escaped Underscore output, but generated breadcrumb HTML is string-built and should become structured rendering.

Medium risks:

- `const` appears in otherwise ES5-style source; older browser compatibility assumptions are inconsistent.
- Production templates include non-HTTPS external URLs.
- The viewport disables user scaling, which is poor for accessibility.
- `debug` mode switches asset roots and should be replaced by modern dev/prod bundler behavior.
- No automated tests are present.

## Migration Complexity Estimate

| Area | Complexity | Reason |
| --- | --- | --- |
| Server routing | Low | Thin redirect/render layer. |
| Content data migration | Low-medium | Central JSON source, but needs schema/types. |
| Static image migration | Low | Assets are local and pathable. |
| Navigation/menu behavior | Medium-high | Custom animation and canvas shape. |
| Thumbnail grid/list behavior | Medium-high | Scroll-triggered animation queue. |
| Article pages | Medium | Mostly templates plus slideshow. |
| Video items | Medium-high | jPlayer replacement and external media verification. |
| Styling migration | Medium-high | Sass/Compass and imperative layout are intertwined. |
| Flash migration | Do not migrate | Keep only as reference/archive. |
| PHP migration | Do not migrate | Historical JSON-generation code only. |

## Recommended Next Step Inputs

Before Step 2 migration planning, decide:

1. Whether the modern app should preserve exact visual/animation fidelity or allow a refined redesign.
2. Whether the external static video host is still authoritative and accessible.
3. Whether `/fl` should be removed entirely or kept as an archival route/page.
4. Whether Spanish/English language handling should remain cookie-based or become URL-based.
5. Whether content editing is needed, or whether versioned static JSON/content files are enough.

## Suggested Migration Approach

Use the existing HTML5 app as a behavioral spec:

1. Capture key screens and flows from `/html5/?debug=1` and production-style `/html5`.
2. Convert `data.json` to a typed content module with validation.
3. Rebuild route/state/navigation around modern framework routes or client state.
4. Migrate presentation components by content type: menu, thumbnails, article, video, breadcrumbs.
5. Recreate animation surfaces one at a time, comparing against captured behavior.
6. Replace jPlayer with native HTML video or a maintained React-friendly media component.
7. Remove Swig, RequireJS, Backbone, Bower, Compass, Grunt, Flash runtime, and unused PHP from the final modern runtime.

