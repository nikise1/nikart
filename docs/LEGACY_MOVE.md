# Moving the legacy app

**Date:** 2026-10-10
**Status:** Plan only. No files have moved.
**Revisits:** [MIGRATION_OVERVIEW.md](MIGRATION_OVERVIEW.md) Option C (legacy at repo root, Next.js in `modern/`)

Two ways to get the Express app out of the working tree. They solve different moments.

| | Archive, then remove | Move into `legacy/` |
|---|---|---|
| When | Step 11, once `nikart.co.uk` is on Vercel and Heroku can go | Before cutover, while Heroku still deploys this repo |
| Repo count | This repo, plus a frozen branch or a second repo | This repo |
| Live site during the change | Heroku must already be pointed at the archive, or DNS must already be on Vercel | Heroku keeps deploying `master`, through a root shim |
| Portfolio JSON and images | Leave this repo with `master`. The archive keeps the old copy | Stay one copy at `public/content/`, read by both apps |
| Next.js path changes | Yes. Imports and sync scripts retarget into `modern/` | None. Vercel Root Directory stays `modern/` |
| Later deletion | The archive stays. This repo no longer has the Express app | Delete `legacy/` at cutover |

**Recommendation:** move the Express app into `legacy/` first. Delete that folder at cutover. Keep promoting `modern/` to the repo root as its own later change.

An archive made now freezes `data.json` and `public/content/img` on the public site. `npm run json:edit` writes the copy in this repo, and Heroku would be serving the other copy.

---

## What is coupled today

`nikart.co.uk` is still the Heroku app. `Procfile` is `web: node server.js`. Heroku installs the root `package.json` (Express, Node 22) and runs with the repo root as the working directory.

Vercel deploys `modern/` (Node 24). The build reads two paths outside that directory, which is why “Include source files outside of the Root Directory” stays on:

| Path | Who reads it |
|------|----------------|
| `public/content/json/data.json` | Legacy Backbone fetch. Next import in `modern/src/lib/data/index.ts` (`../../../../public/content/json/data.json`). `sync:json` minifies a Flash copy into `modern/public/content/json/data.json`. `npm run json:edit` |
| `public/content/img/` (308 files) | Legacy static server. `sync:images` copies into `modern/public/_generated/img/` |

Those two trees are the portfolio. They are shared data, and they stay at `public/content/` until the Express app is gone.

Legacy-only trees:

| Path | Role |
|------|------|
| `server.js`, `app/` | Express routes and Swig views. `require()` is relative to the file. `views` and `express.static` are relative to the process working directory |
| `public/html5/` | Backbone client |
| `public/fl/` | Legacy Flash shell (`swfobject`, `main.swf`). Next already has its own `modern/public/fl/main.swf` and `main.ruffle.swf` |
| `public/accessible/` | Old accessible pages |
| `src/fl/`, `src/php/` | Animate/PHP sources. `.slugignore` already keeps `src` off the Heroku slug |
| Root `package.json` engines `22.x` | Heroku’s Node version. `modern/package.json` engines `24.x` is what Vercel uses |

Root `package.json` also owns `npm run modern` and `npm run json:edit`. `.cursor/environment.json` installs both apps and starts `npm start` (port 5000) and `npm run modern` (port 3000).

---

## Option A — Move into `legacy/`

One commit. Heroku still deploys this repo. Next imports stay pointed at `public/content/`.

### Layout after the move

```
legacy/
  server.js
  app/
  src/
  public/
    html5/
    fl/
    accessible/
  README.md          # today’s root README
public/
  content/           # unchanged canonical JSON and images
modern/              # unchanged
Procfile             # web: node legacy/server.js
package.json         # Express deps, Node 22, scripts start / modern / json:edit
app.json
.slugignore
```

`git mv` the legacy-only trees. Leave `public/content/` where it is.

### Server paths

Heroku’s working directory stays the repo root, so the two cwd-relative lines in `server.js` change with the move:

```js
app.set('views', './legacy/app/views');
app.use(express.static('./legacy/public'));
app.use(express.static('./public'));
```

The second static mount is how `/content/json/data.json` and `/content/img/…` keep working. `/html5/…` and `/fl/…` resolve from `legacy/public`. `require('./app/controllers/…')` keeps working because `server.js` moves next to `app/`.

### Root shim (same commit)

- `Procfile`: `web: node legacy/server.js`
- Root `package.json`: keep Express, Swig, `compression`, `cookie-parser`, and `"node": "22.x"`. `"start": "node legacy/server.js"`. Keep `modern` and `json:edit`.
- `.slugignore`: `src` becomes `legacy/src`. Add `modern` so the Heroku slug stops uploading the Next app.
- `app.json` stays at the repo root. Heroku reads it there.
- `.cursor/environment.json`: `npm start` still boots legacy, because the root start script points at `legacy/server.js`.
- Root `AGENTS.md` and `README.md`: legacy lives in `legacy/`; `npm start` runs it; `npm run modern` is unchanged.

### Checks before that commit hits `master`

Heroku has no review-app config in `app.json`. The gate is local, then the `master` deploy is production:

1. `npm start`, then `GET /html5`, `GET /html5/dist/scripts/main.js`, `GET /content/json/data.json`, and `GET /content/img/stump.png` return 200.
2. `npm run modern`, then `/en` still renders thumbnails.
3. `npm run test:run --prefix modern` passes. The data import path did not change.
4. Watch the Heroku release after merge. `/html5` on `nikart.co.uk` is the production check.

### Cutover, later

When DNS is on Vercel and `dig nikart.co.uk` shows Vercel:

1. Delete `legacy/`, `Procfile`, `app.json`, `.slugignore`, and the Express dependencies.
2. Move `public/content/json/data.json` and `public/content/img/` under `modern/` (outside `modern/public/`, so Next does not publish a second copy next to `_generated/`).
3. Retarget `modern/src/lib/data/index.ts`, `schema.test.ts`, `sync-content-json.mjs`, `sync-content-images.mjs`, and `open-json-editor.mjs`.
4. Turn off Vercel “Include source files outside of the Root Directory”.
5. Root `package.json` can stay as the `modern` / `json:edit` launcher, or those scripts move into `modern/` and `AGENTS.md` changes with them.

Promoting `modern/` to the repo root is a separate commit after that. It rewrites every path inside the Next app and the Vercel Root Directory setting (from `modern/` to the repo root). The removal does not need it. Vercel is already building `modern/`.

---

## Option B — Archive, then remove

Use this when the Express app can leave `master` because production no longer depends on this repo’s root, or because Heroku has been pointed at a frozen ref first.

GitHub will not fork `nikise1/nikart` into the same account. The archive is either:

- a branch `archive/legacy` at the current `master` tip, and Heroku’s GitHub integration (or `git push heroku archive/legacy:master`) deploys that ref, or
- a new repo, `nikart-legacy`, created by pushing that same snapshot.

### Sequence

1. Create the archive ref from current `master`. Push it.
2. Point Heroku at that ref. Confirm `https://nikart.co.uk/html5` still serves before changing `master`.
3. On `master`, move `public/content/` under `modern/` and retarget the five readers listed in Option A’s cutover list.
4. Delete `server.js`, `app/`, `src/`, `public/html5`, `public/fl`, `public/accessible`, `Procfile`, `app.json`, `.slugignore`, and the Express dependencies.
5. Disable Vercel “include files outside the root” after a preview build has copied images and JSON from inside `modern/`.
6. Update root `AGENTS.md`, `README.md`, and `.cursor/environment.json` (drop the legacy terminal and the root `npm install`).

From that commit on, `npm run json:edit` updates the modern site only. The Heroku archive keeps the JSON and images it had at the branch point.

Leave the Next app in `modern/` in this change. Hoisting it to the repo root is the same follow-up as in Option A.

---

## Why the folder comes first

- Portfolio edits stay one file. The public site and the beta both read `public/content/json/data.json`.
- Heroku’s Node 22 app and Vercel’s Node 24 app stay separated by which `package.json` each platform installs. Copying `modern/package.json` to the repo root would make Heroku try to boot Next.
- `git mv` keeps history on the paths agents still open. Deleting the folder at cutover is one commit.
- The June objection to a subfolder was the Heroku buildpack. The shim above is a `Procfile` line and two static mounts, and the Next app does not move.

The archive is the right tool on the day Heroku is turned off, as a tag or branch to read later. It is a poor place to keep the live site while JSON is still edited in this repo.
