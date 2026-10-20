# Nikart

Next.js 16 portfolio app in `www-root/` (migration from legacy Express/Backbone).

## Commands

From repo root:

```bash
npm run www-root     # dev server (alias for www-root/npm run dev)
```

From `www-root/`:

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm run start        # serve production build
npm run lint
npm run test:run     # unit tests
npm run test:e2e     # Playwright E2E
```

## Deploy to Vercel (preview)

**Critical:** set the Vercel project **Root Directory** to `www-root/`. The legacy Express app lives in `legacy-2014/` and must not be deployed. Leave **Include source files outside of the Root Directory in the Build Step** enabled (Vercel default) so the build can read repo-root `content/img`.

Do **not** set an Output Directory. `framework: nextjs` in `vercel.json` is enough; pointing output at `.next` breaks middleware and SSR.

### Option A — Git import (recommended)

1. Open [vercel.com/new](https://vercel.com/new) and import `nikise1/nikart`.
2. **Root Directory:** `www-root/` (keep “Include source files outside of the Root Directory” checked)
3. Framework: Next.js (from `vercel.json`). Node `24` from `.nvmrc` / `engines`. `engines` overrides the Node version in Vercel project settings.
4. No environment variables required for WIP (static JSON content, videos proxied to `static.nikart.co.uk`).
5. Deploy. Every push to `master` and every PR gets a preview URL.

### Option B — CLI

```bash
cd www-root
npx vercel login
npx vercel link
npx vercel          # preview deploy
npx vercel --prod   # production deploy (after cutover)
```

### Content images

One copy in git: repo-root `content/img`. Install/build copies it to `www-root/public/_generated/img/` (gitignored as `www-root/public/_generated/`). A rewrite maps `/content/img/…` → `/_generated/img/…` so app URLs stay the same. `legacy-2014` serves the same tree at `/content`.

Do not symlink `www-root/public/content/img` to `content/img` — Vercel copies `public/` and errors with “Cannot copy … to a subdirectory of itself”.

`postinstall` and the Vercel `buildCommand` run `npm run sync:images`. To refresh locally after changing images, run that again from `www-root/`.

### Content JSON

Portfolio JSON is edited as three source files in repo-root `content/json/`:

- `main.json` — menu order and links to content. The same id can appear in more than one menu.
- `items.json` — flat array of content objects, one definition per id.
- `items-disabled.json` — content objects kept out of `data.json`, plus an optional `menu_positions` list. `npm run json:items -- --disable id1,id2 --enable id3` moves them, drops or restores the `main.json` links, and rebuilds.
- `other.json` — shared en/es UI text (`back`, video quality, and the speed labels).

`npm run compile:json` (also `dev`, `prebuild`, and `sync:json`) joins those files into `content/json/data.json`. That compiled file is the nested tree Flash, legacy Backbone, and Next import. It has to match `DataSchema` in `src/lib/data/schema.ts`. Install and the Vercel build minify it into `www-root/public/content/json/data.json` (gitignored) so Flash can load `/content/json/data.json`.

To edit the sources in a tree, run `npm run json:edit` from the repo root. That prints a link for each source file which opens [JSON Editor Online](https://jsoneditoronline.org) with the file already loaded. Add `-- --open` to open the browser on your machine. After you copy the edited JSON back, run `npm run sync:json` from `www-root/`.

### Post-deploy smoke test

- `/en/` and `/es/` — locale routes
- `/content/img/…` — thumbnail images
- `/video_h264/…` — rewrite to `static.nikart.co.uk`
- `/fl` — Flash archival (Ruffle)

See `docs/PROGRESS.md` for the post-migration log. The migration checklist is in `docs/legacy-migration/`.
