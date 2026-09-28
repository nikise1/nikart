# Temporary SWF compare kit

Local copies of portfolio Flash files, each on its own HTML page with **Ruffle** and **AwayFL** side by side.

Players load movies from `/swf-compare/pieces/{id}/…` (the committed copies). The **legacy lizard Flash site** uses the copy at `/swf-compare/pieces/lizard-site/main.swf` with Flash 8 flashVars and Ruffle `base=/fl/` so the AS2 UI can fetch content JSON and images; AwayFL’s loader URL stays `/fl/main.swf`. The compare page must not set `<base href="/fl/">` — that makes Safari resolve Ruffle WASM/workers under `/fl/` and abort `main.swf`. Ruffle `base` and AwayFL’s play URL are that movie directory, so child SWF/XML/JPEG requests stay next to the SWF. Both players share one SWF fetch; AwayFL starts after Ruffle so Safari is not asked to allocate two WASM heaps at once. Next rewrites `/swf-compare/pieces/content/` to `/content/` for AwayFL’s `../content` loads.

```bash
npm run swf-compare:sync --prefix modern
```

That downloads SWFs and sidecars from `http://static.nikart.co.uk` into `public/swf-compare/pieces/` (committed for Vercel live preview). Child movies and XML listed in `xml/config.xml` are resolved from the SWF directory (Flash Loader base). JPEGs built at runtime (config `img/` folders, Escalera `img/p_{n}/{i}.jpg`, DAE textures) are copied the same way. Ruffle and AwayFL runtimes are also committed under `public/ruffle/` and `public/awayfl/` so the preview can load the players. Open `/swf-compare/index.html`. Portfolio launch buttons and `nikart.popWin` go to these pages instead of the old popup.
