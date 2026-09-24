# Temporary SWF compare kit

One HTML page per portfolio SWF, with **Ruffle** and **AwayFL** side by side.

Players load movies from `http://static.nikart.co.uk` through the Next.js `/static` rewrite (HTTPS same-origin, so mixed content and S3 CORS are not in the way). Ruffle `base` and AwayFL’s play URL are that movie directory, so child SWF/XML/JPEG requests stay on `/static/…`.

```bash
npm run swf-compare:sync --prefix modern
```

Sync only refreshes the compare HTML catalog. Ruffle and AwayFL runtimes are committed under `public/ruffle/` and `public/awayfl/` so the preview can load the players. Open `/swf-compare/index.html`. Portfolio launch buttons and `nikart.popWin` go to these pages instead of the old popup.
