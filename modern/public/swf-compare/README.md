# Temporary SWF compare kit

Local copies of portfolio Flash files, each on its own HTML page with **Ruffle** and **AwayFL** side by side.

```bash
npm run swf-compare:sync --prefix modern
```

That downloads SWFs and sidecars from `http://static.nikart.co.uk` into `public/swf-compare/pieces/` (committed for Vercel live preview). Ruffle and AwayFL runtimes are also committed under `public/ruffle/` and `public/awayfl/` so the preview can load the players. Open `/swf-compare/index.html`. Portfolio launch buttons and `nikart.popWin` go to these pages instead of the old popup.
