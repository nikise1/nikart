# Moving the legacy app

**Date:** 2026-10-10
**Status:** Plan only. No files have moved.
**Revisits:** [MIGRATION_OVERVIEW.md](MIGRATION_OVERVIEW.md) Option C (legacy at repo root, Next.js in `modern/`)

**Update (2026-10-10):** The Heroku app does not need to keep deploying this repo. `nikart.co.uk` DNS is still a separate cutover. Removing the Express app from `master` does not wait on that DNS change.

| | Archive, then remove | Move into `legacy/` |
|---|---|---|
| Working tree | Next app, docs, and portfolio content | Express app still in this checkout, under `legacy/` |
| Archive | Branch `archive/legacy` (or a second repo) frozen at today’s `master` | The folder is the archive until a later delete |
| Heroku | This repo stops booting it. That is acceptable | A root `Procfile` shim could keep booting it. Nothing needs that shim |
| Portfolio JSON and images | Move under `modern/content/`. One copy, edited from this repo | Could stay at `public/content/` until the folder is deleted |
| Next.js path changes | Imports and sync scripts retarget into `modern/` | None, until the later delete |
| Vercel | Root Directory stays `modern/`. “Include source files outside of the Root Directory” can turn off after a green preview | Unchanged, because content would still sit outside `modern/` |

**Recommendation:** archive today’s `master`, then delete the Express app from this repo and move `public/content/` under `modern/`. Leave the Next app in `modern/`. Promoting that folder to the repo root is a later commit.

A `legacy/` folder would keep the Express tree one `cd` away, and it would still need a second commit to delete it. With Heroku allowed to stop, that intermediate tree has nothing left to serve.

---

## What has to move with the Next app

Vercel deploys `modern/` (Node 24) and currently reads two paths outside that directory:

| Path | Who reads it |
|------|----------------|
| `public/content/json/data.json` | Next import in `modern/src/lib/data/index.ts` (`../../../../public/content/json/data.json`). `sync:json` minifies a Flash copy into `modern/public/content/json/data.json`. `npm run json:edit` |
| `public/content/img/` (308 files) | `sync:images` copies into `modern/public/_generated/img/` |

Those two trees are the portfolio. They move to `modern/content/` (outside `modern/public/`, so Next does not publish a second copy next to `_generated/`).

Express-only trees to delete from `master` after the archive exists:

| Path | Role |
|------|------|
| `server.js`, `app/` | Express routes and Swig views |
| `public/html5/` | Backbone client |
| `public/fl/` | Legacy Flash shell. Next already has `modern/public/fl/main.swf` and `main.ruffle.swf` |
| `public/accessible/` | Old accessible pages |
| `src/fl/`, `src/php/` | Animate/PHP sources |
| `Procfile`, `app.json`, `.slugignore` | Heroku deploy files |
| Root `package.json` Express deps and `"node": "22.x"` | Heroku’s install. `modern/package.json` engines `24.x` is what Vercel uses |

Root `package.json` also owns `npm run modern` and `npm run json:edit`. Those scripts stay, in a dependency-free root `package.json`. `.cursor/environment.json` drops the legacy terminal and the root `npm install`.

---

## Archive, then remove

GitHub will not fork `nikise1/nikart` into the same account. The archive is a branch.

### Sequence

1. From current `master`, push `archive/legacy`. That branch is the readable, buildable Express app. A second repo is optional and would be a push of the same snapshot.
2. On the working branch, `git mv` `public/content/json` and `public/content/img` to `modern/content/json` and `modern/content/img`.
3. Retarget the readers:
   - `modern/src/lib/data/index.ts` and `modern/src/lib/data/schema.test.ts` import `../../../content/json/data.json`
   - `modern/scripts/sync-content-json.mjs` and `sync-content-images.mjs` read `modern/content/…`
   - `modern/scripts/open-json-editor.mjs` reads `modern/content/json/data.json`
4. Delete `server.js`, `app/`, `src/`, `public/html5`, `public/fl`, `public/accessible`, `Procfile`, `app.json`, `.slugignore`, and the Express dependencies from root `package.json` and `package-lock.json`.
5. Root `package.json` keeps `modern` and `json:edit` only. Root `README.md` and `AGENTS.md` describe the Next app. `.cursor/environment.json` installs with `npm install --prefix modern` and starts `npm run modern` on port 3000.
6. Ship the preview. Confirm `/en`, `/content/img/stump.png`, and `/fl` on the Vercel preview. Then turn off “Include source files outside of the Root Directory” in the Vercel project. The build already succeeds with that switch still on, because the files it reads are inside `modern/`.

`npm run test:run --prefix modern` is the local gate. The data schema test still checks that the git copy is pretty-printed and the synced Flash copy is minified.

Leave the Next app in `modern/` in this change. Hoisting it to the repo root rewrites every path inside the app and the Vercel Root Directory setting (from `modern/` to the repo root). Vercel is already building `modern/`.

`nikart.co.uk` can keep pointing at the old host until the DNS cutover. This removal does not retarget that domain, and it does not try to keep the Heroku release healthy.

---

## Move into `legacy/`

Still possible, and a worse fit now.

`git mv` the Express-only trees into `legacy/`, leave `public/content/` at the repo root, and skip the Heroku shim (`Procfile`, Node 22 engines, dual static mounts). The Next imports stay put. A later commit still has to delete `legacy/` and retarget content into `modern/`, which is the whole archive-and-remove change.

Use the folder only if day-to-day work needs the Backbone sources open on `master` beside the Next app. Reading them on `archive/legacy` covers the other cases.
