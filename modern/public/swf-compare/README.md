# Temporary SWF compare kit

One HTML page per SWF with **Ruffle** and **AwayFL** side by side.

Portfolio movies load from **`https://static.nikart.co.uk`** (CloudFront HTTPS + CORS). Child SWF/XML/JPEG URLs resolve from that movie directory, so this repo does not duplicate the bucket. The **legacy lizard Flash site** stays on `/fl/main.ruffle.swf` (same Ruffle tongue-chord patch as `/fl`) with Flash 8 flashVars and Ruffle `base=/fl/`. The compare page must not set `<base href="/fl/">` — that makes Safari resolve Ruffle WASM/workers under `/fl/` and abort the movie. Both players share one SWF fetch; AwayFL starts after Ruffle. AwayFL LoadVars still asks for `../content/json/data.json` against the HTML page; compare `players.js` rewrites that to `/content/`. A sibling file `/awayfl/loadvars-ondata-patch.js` makes the movie’s `LoadVars.onData` override stick (AwayFL marks that prototype slot read-only).

```bash
npm run swf-compare:html --prefix modern
```

That rewrites piece HTML from the catalog (no SWF download). `npm run swf-compare:sync --prefix modern` still reads wrapper HTML on the origin to discover SWF names, then writes the same pages. Ruffle and AwayFL runtimes are committed under `public/ruffle/` and `public/awayfl/` so the preview can load the players. Index cards (within each group) and piece topnav prev/next both follow `swf-compare-catalog.json` order — not A–Z. Each piece page stores `{ ruffle, awayfl }` visibility in `localStorage` key `swf-compare-pages` (one entry per piece id), falling back to committed defaults in `visibility-defaults.json`. Hide/Show buttons sit next to each player, and index cards show those two flags as clickable toggles. Open `/swf-compare/index.html`. Portfolio launch buttons and `nikart.popWin` go to these pages instead of the old popup.
