# Temporary SWF compare kit

One HTML page per portfolio SWF, with **Ruffle** and **AwayFL** side by side.

Players load movies from `http://static.nikart.co.uk` through `/static`. A Node route handler fetches the HTTP origin so Vercel HTTPS previews are not blocked by mixed content or a broken rewrite. Ruffle `base` and AwayFL’s play URL are that movie directory, so child SWF/XML/JPEG requests stay on `/static/…`.

```bash
npm run swf-compare:sync --prefix modern
```

Sync only refreshes the compare HTML catalog. Ruffle and AwayFL runtimes are committed under `public/ruffle/` and `public/awayfl/` so the preview can load the players. Open `/swf-compare/index.html`. Portfolio launch buttons and `nikart.popWin` go to these pages instead of the old popup.
