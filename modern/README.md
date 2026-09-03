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

**Critical:** set the Vercel project **Root Directory** to `modern/`. The legacy app lives at the repo root and must not be deployed.

### Option A — Git import (recommended)

1. Open [vercel.com/new](https://vercel.com/new) and import `nikise1/nikart`.
2. **Root Directory:** `modern/`
3. Build settings are read from `vercel.json` (Next.js, `npm run build`).
4. No environment variables required for WIP (static JSON content, videos proxied to `static.nikart.co.uk`).
5. Deploy. Every push to `main` and every PR gets a preview URL.

### Option B — CLI

```bash
cd modern
npx vercel login
npx vercel link
npx vercel          # preview deploy
npx vercel --prod   # production deploy (after cutover)
```

### Post-deploy smoke test

- `/en/` and `/es/` — locale routes
- `/content/img/…` — thumbnail images (symlinked from legacy `public/content/img/`)
- `/video_h264/…` — rewrite to `static.nikart.co.uk`
- `/fl` — Flash archival (Ruffle)

See `docs/PROGRESS.md` Step 10 for the full checklist.
