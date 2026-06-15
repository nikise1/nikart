# Legacy Analysis — Opinions & Recommendations

Subjective assessments extracted from the Step 1 audit.

---

## Overall Migration Complexity: Medium

The app is a classic single-page portfolio with well-separated concerns. The main challenges are:
1. Converting 8 Backbone views + event bus to a modern component architecture
2. Reproducing GSAP animation sequences with equivalent fidelity
3. Preserving the bilingual content system

The data model (nested JSON tree with route-based navigation) is clean and can be consumed directly by a modern framework.

---

## Recommendations for Migration

1. **Drop entirely:** Flash version, Bower, RequireJS, Swig, jPlayer, Modernizr, IE conditionals, PHP files
2. **Preserve:** JSON data structure, GSAP animation timings/easing, responsive breakpoints, bilingual content
3. **Modernise:** GSAP 1.x → GSAP 3 or Framer Motion, Backbone → React/framework components, jQuery → native DOM
4. **Add:** TypeScript, ESLint, testing framework, proper i18n library, native `<video>`

---

## Suggested Migration Approach

Use the existing HTML5 app as a behavioral spec:

1. Capture key screens and flows from `/html5/?debug=1` and production-style `/html5`.
2. Convert `data.json` to a typed content module with validation.
3. Rebuild route/state/navigation around modern framework routes or client state.
4. Migrate presentation components by content type: menu, thumbnails, article, video, breadcrumbs.
5. Recreate animation surfaces one at a time, comparing against captured behavior.
6. Replace jPlayer with native HTML video or a maintained React-friendly media component.
7. Remove Swig, RequireJS, Backbone, Bower, Compass, Grunt, Flash runtime, and unused PHP from the final modern runtime.

---

## Decisions Before Step 2

1. Whether the modern app should preserve exact visual/animation fidelity or allow a refined redesign.
2. Whether the external static video host (`http://static.nikart.co.uk`) is still authoritative and accessible.
3. Whether `/fl` should be removed entirely or kept as an archival route/page.
4. Whether Spanish/English language handling should remain cookie-based or become URL-based.
5. Whether content editing is needed, or whether versioned static JSON/content files are enough.
6. **Repo structure during migration** — Decided: Option C (additive). Legacy stays at repo root (Heroku untouched), modern app added in `modern/` folder (deployed separately via Vercel/Netlify). Both apps live simultaneously. Cleanup commit after legacy decommission.

---

## Migration Implications (from detailed analysis)

- **Content data** should become typed early, ideally with validation. The existing schema is small enough to model directly, but multilingual fields and type-specific optional fields need explicit types.
- **Layout behavior** should be preserved via a focused visual regression pass before replacing imperative sizing. Expect some fragile mobile/orientation behavior.
- **External static domain and video files** need verification before committing to the new media architecture. Image assets are local and easier to preserve.
- **Flash code** should be treated as reference material only.
- **PHP code** should not be migrated as runtime code unless there is a separate content-editing requirement.
- **The existing HTML5 app** should be treated as the canonical product experience; Flash and PHP are archival references.
