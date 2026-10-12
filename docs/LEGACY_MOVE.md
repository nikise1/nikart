# Moving the legacy app

**Date:** 2026-10-10
**Status:** Plan only. The year in `legacy-[year]` is still open, and the rename of `modern/` is still open. No files have moved.
**Revisits:** [MIGRATION_OVERVIEW.md](MIGRATION_OVERVIEW.md) Option C (legacy at repo root, Next.js in `modern/`)

**Update (2026-10-12):** Keep the Express app in this repo, under `legacy-[year]/`. Rename `modern/` when that name is chosen. Further versions and skins are sibling folders. Portfolio JSON and images stay one shared tree at `content/`, outside every version.

Heroku does not need to keep deploying this repo (2026-10-10). `nikart.co.uk` DNS stays a separate cutover.

---

## Where each current path goes

### Into `legacy-[year]/`

The Express site and the sources that belong to it:

| Current path | Lands at |
|--------------|----------|
| `server.js` | `legacy-[year]/server.js` |
| `app/` | `legacy-[year]/app/` |
| `src/fl/`, `src/php/` | `legacy-[year]/src/` |
| `public/html5/` | `legacy-[year]/public/html5/` |
| `public/fl/` | `legacy-[year]/public/fl/` |
| `public/accessible/` | `legacy-[year]/public/accessible/` |
| `Procfile`, `app.json`, `.slugignore` | `legacy-[year]/` |
| Root `package.json` Express deps, engines `22.x`, and `package-lock.json` | `legacy-[year]/package.json` and lockfile |
| Root `README.md` | `legacy-[year]/README.md` (it documents `npm start` and `/html5`) |

`public/fl/main.swf` moves with that shell. The Next app already has its own `modern/public/fl/main.swf` and `main.ruffle.swf`.

### Stays shared, at the repo root

| Current path | Lands at | Why it stays out of every version |
|--------------|----------|-----------------------------------|
| `public/content/json/data.json` | `content/json/data.json` | Pretty-printed portfolio tree. Next imports it. `sync:json` minifies a Flash copy into the app’s `public/content/json/data.json`. `npm run json:edit` writes this file |
| `public/content/img/` (308 files) | `content/img/` | `sync:images` copies into the app’s `public/_generated/img/`. A rewrite serves them at `/content/img/…` |

A later skin reads the same `content/` tree. Putting it inside `legacy-[year]/` or inside the renamed Next app would make every other version depend on that folder.

After this move the root `public/` directory is gone. `content/` is the neutral name.

### Stays at the repo root, and is not a version

| Path | Role |
|------|------|
| `docs/` | Migration history, radar, this plan |
| `AGENTS.md` | Repo rules. The Next app keeps its own `AGENTS.md` inside its folder |
| `.github/dependabot.yml` | Already scoped to `/modern`. The directory field changes when `modern/` is renamed. A new skin can add its own entry |
| `.cursor/environment.json` | Install and terminals, updated to the new folder names |
| `.gitignore`, `.gitattributes` | `modern/public/_generated/` and `public/html5/node_modules` get the new prefixes |
| `nikart.code-workspace` | Editor workspace |
| Root `package.json` | Launcher only, after the Express manifest moves: `json:edit`, plus one script per version |

### Moves by renaming `modern/`

The whole `modern/` tree stays intact and takes the new folder name: app source, `package.json`, `vercel.json`, `AGENTS.md`, sync scripts, and the gitignored generated copies under `public/_generated/` and `public/content/json/`.

Vercel’s Root Directory changes from `modern/` to that name. “Include source files outside of the Root Directory” stays on, because `content/` lives outside the app folder. Each future skin that Vercel deploys gets the same setting.

Scripts that retarget in the same change:

- `modern/src/lib/data/index.ts` and `schema.test.ts` (today: `../../../../public/content/json/data.json`)
- `modern/scripts/sync-content-json.mjs` and `sync-content-images.mjs`
- `modern/scripts/open-json-editor.mjs`
- Root `AGENTS.md` path for `npm run json:edit`

---

## Example tree

`YYYY` and the Next folder name are placeholders.

```
content/                              # shared portfolio data
  json/data.json
  img/                                # 308 files
legacy-YYYY/                          # Express, Backbone, Flash shell
  server.js
  package.json                        # Express, Node 22
  package-lock.json
  Procfile
  app.json
  .slugignore
  README.md
  app/
    controllers/
    models/
    views/
  src/
    fl/
    php/
  public/
    html5/                            # Backbone client
    fl/                               # swfobject shell + main.swf
    accessible/
site/                                 # rename of modern/; name still open
  package.json                        # Next.js, Node 24
  package-lock.json
  vercel.json
  AGENTS.md
  src/
  scripts/                            # sync content/ → public copies
  public/
    _generated/img/                   # gitignored copy of content/img
    content/json/data.json            # gitignored minified copy
    fl/                               # this app’s SWF copies
another-skin/                         # later version, same shape
  package.json
  src/
  public/
docs/
AGENTS.md                             # repo rules
package.json                          # json:edit + one script per version
.gitignore
.github/dependabot.yml
.cursor/environment.json
```

A new skin is a sibling of `legacy-YYYY/` and of the renamed Next app. It gets its own `package.json`, its own Vercel root, and it reads `content/`. It does not get a copy of `data.json` or `content/img/` in git.
