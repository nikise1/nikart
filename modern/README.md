# Nikart Modern migration

Next.js 16 portfolio app (migration from legacy Express/Backbone).

## Commands

From repo root:

```bash
npm run modern       # dev server (alias for modern/npm run dev)
```

From `modern/`:

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build
npm run start        # serve production build
npm run lint
npm run test:run     # unit tests
npm run test:e2e     # Playwright E2E
```

## Deploy to Vercel (preview)

**Critical:** set the Vercel project **Root Directory** to `modern/`. The legacy Express app lives at the repo root and must not be deployed. Leave **Include source files outside of the Root Directory in the Build Step** enabled (Vercel default) so the build can read repo-root `public/content/img`.

Do **not** set an Output Directory. `framework: nextjs` in `vercel.json` is enough; pointing output at `.next` breaks middleware and SSR.

### Option A — Git import (recommended)

1. Open [vercel.com/new](https://vercel.com/new) and import `nikise1/nikart`.
2. **Root Directory:** `modern/` (keep “Include source files outside of the Root Directory” checked)
3. Framework: Next.js (from `vercel.json`). Node `22` from `.nvmrc` / `engines`.
4. No environment variables required for WIP (static JSON content, videos proxied to `static.nikart.co.uk`).
5. Deploy. Every push to `master` and every PR gets a preview URL.

### Option B — CLI

```bash
cd modern
npx vercel login
npx vercel link
npx vercel          # preview deploy
npx vercel --prod   # production deploy (after cutover)
```

### Content images

One copy in git: repo-root `public/content/img` (legacy). Install/build copies it to `modern/public/_generated/img/` (gitignored as `modern/public/_generated/`). A rewrite maps `/content/img/…` → `/_generated/img/…` so app URLs stay the same. The legacy app is not changed.

Do not symlink `modern/public/content/img` to the legacy folder — Vercel copies `public/` and errors with “Cannot copy … to a subdirectory of itself”.

`postinstall` and the Vercel `buildCommand` run `npm run sync:images`. To refresh locally after changing legacy images, run that again from `modern/`.

### Content JSON

One copy in git: repo-root `public/content/json/data.json`, pretty printed (legacy Backbone and the Next data import). Install and the Vercel build minify it into `modern/public/content/json/data.json` (gitignored) so Flash can load `/content/json/data.json`.

To edit it in a tree, run `npm run json:edit` from the repo root. That prints a link which opens [JSON Editor Online](https://jsoneditoronline.org) with this file already loaded. Add `-- --open` to open the browser on your machine. After you copy the edited JSON back, run `npm run sync:json` from `modern/`.

### Post-deploy smoke test

- `/en/` and `/es/` — locale routes
- `/content/img/…` — thumbnail images
- `/video_h264/…` — rewrite to `static.nikart.co.uk`
- `/fl` — Flash archival (Ruffle)

See `docs/PROGRESS.md` Step 10 for the full checklist.
