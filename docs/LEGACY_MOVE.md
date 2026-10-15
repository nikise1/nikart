# Moving the legacy app

**Date:** 2026-10-10
**Status:** Done 2026-10-14. The Express app is in `legacy-2014/`. Shared JSON and images are in `content/`. The Next.js app is `www-root/` (renamed from `modern/`). Vercel Root Directory is `www-root/` (set 2026-10-15). “Include source files outside of the Root Directory” stays on.
**Revisits:** [MIGRATION_OVERVIEW.md](MIGRATION_OVERVIEW.md) Option C (legacy at repo root, Next.js in a sibling folder)

**Update (2026-10-12):** Keep the Express app in this repo, under `legacy-2014/`. Rename `modern/` when that name is chosen. Further versions and skins are sibling folders. Portfolio JSON and images stay one shared tree at `content/`, outside every version.

**Update (2026-10-13):** That move is in the tree. `legacy-2014/server.js` serves repo-root `content/` at `/content`, so Backbone `../content` URLs still resolve. The root `package.json` is a launcher: `modern`, `legacy-2014`, and `json:edit`. The Next folder in the example below was still a placeholder; the app was `modern/`.

**Update (2026-10-14):** The Next.js folder is `www-root/`. The root launcher scripts are `www-root`, `legacy-2014`, and `json:edit`. Dependabot, `.gitignore`, and `.cursor/environment.json` use `www-root/`. Imports of `content/json/data.json` stay `../../../../content/json/data.json` because the app folder is still one level below the repo root. Sync scripts still walk up one directory to `content/`.

Heroku does not need to keep deploying this repo. The subscription was cancelled on 2026-10-10, and `nikart.herokuapp.com` stays until that paid month ends. DNS cutover to Vercel finished on 2026-10-09.

---

## Where each current path goes

### Into `legacy-2014/`

The Express site and the sources that belong to it:

| Current path | Lands at |
|--------------|----------|
| `server.js` | `legacy-2014/server.js` |
| `app/` | `legacy-2014/app/` |
| `src/fl/`, `src/php/` | `legacy-2014/src/` |
| `public/html5/` | `legacy-2014/public/html5/` |
| `public/fl/` | `legacy-2014/public/fl/` |
| `public/accessible/` | `legacy-2014/public/accessible/` |
| `Procfile`, `app.json`, `.slugignore` | `legacy-2014/` |
| Root `package.json` Express deps, engines `22.x`, and `package-lock.json` | `legacy-2014/package.json` and lockfile |
| Root `README.md` | `legacy-2014/README.md` (it documents `npm start` and `/html5`) |

`public/fl/main.swf` moves with that shell. The Next app has its own `www-root/public/fl/main.swf` and `main.ruffle.swf`.

### Stays shared, at the repo root

| Current path | Lands at | Why it stays out of every version |
|--------------|----------|-----------------------------------|
| `public/content/json/data.json` | `content/json/data.json` | Pretty-printed portfolio tree. Next imports it. `sync:json` minifies a Flash copy into the app’s `public/content/json/data.json`. `npm run json:edit` writes this file |
| `public/content/img/` (308 files) | `content/img/` | `sync:images` copies into the app’s `public/_generated/img/`. A rewrite serves them at `/content/img/…` |

A later skin reads the same `content/` tree. Putting it inside `legacy-2014/` or inside the renamed Next app would make every other version depend on that folder.

After this move the root `public/` directory is gone. `content/` is the neutral name.

### Stays at the repo root, and is not a version

| Path | Role |
|------|------|
| `docs/` | Migration history, radar, this plan |
| `AGENTS.md` | Repo rules. The Next app keeps its own `AGENTS.md` inside its folder |
| `.github/dependabot.yml` | Scoped to `/www-root` (was `/modern`). A new skin can add its own entry |
| `.cursor/environment.json` | Install and terminals use `www-root` |
| `.gitignore`, `.gitattributes` | `www-root/public/_generated/` and `legacy-2014/public/html5/node_modules`. `.gitattributes` has no folder prefixes |
| `nikart.code-workspace` | Editor workspace |
| Root `package.json` | Launcher only, after the Express manifest moves: `json:edit`, plus one script per version |

### Renamed `modern/` to `www-root/`

Done 2026-10-14. The whole tree moved intact: app source, `package.json`, `vercel.json`, `AGENTS.md`, sync scripts, and the gitignored generated copies under `public/_generated/` and `public/content/json/`.

Vercel’s Root Directory is `www-root/` (set 2026-10-15). “Include source files outside of the Root Directory” stays on, because `content/` lives outside the app folder. Each future skin that Vercel deploys gets the same setting. The 2026-10-14 preview failed while that setting was still `modern/`.

Paths that follow the folder name:

- `www-root/src/lib/data/index.ts` and `schema.test.ts` import `../../../../content/json/data.json`
- `www-root/scripts/sync-content-json.mjs` and `sync-content-images.mjs`
- `www-root/scripts/open-json-editor.mjs`
- Root `AGENTS.md` path for `npm run json:edit` and `npm run sync:json --prefix www-root`

---

## Example tree

The Next.js folder is `www-root/`. The legacy folder is `legacy-2014/`.

```
content/                              # shared portfolio data
  json/data.json
  img/                                # 308 files
legacy-2014/                          # Express, Backbone, Flash shell
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
www-root/                             # Next.js; renamed from modern/
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

A new skin is a sibling of `legacy-2014/` and of `www-root/`. It gets its own `package.json`, its own Vercel root, and it reads `content/`. It does not get a copy of `data.json` or `content/img/` in git.
