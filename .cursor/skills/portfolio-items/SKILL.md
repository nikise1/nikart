---
name: portfolio-items
description: >
  Enable or disable portfolio items when the user says "disable: id1, id2"
  and/or "enable: id3, id4". Moves those ids between content/json/items.json
  and content/json/items-disabled.json, parks portfolio jpgs whose id is
  absent from main.json in content/img-disabled, rebuilds data.json, and
  parks or restores that id's SWF compare pages in
  public/swf-compare-disabled.
---

# Enable or disable portfolio items

Use this when the user message names portfolio ids with `disable:` and/or `enable:`.

```
disable: site1, site2
enable: site3, site4
```

Either line can be omitted. Ids are comma-separated.

From the repo root, run one command. Do not edit the JSON by hand.

```bash
npm run json:items -- --disable site1,site2 --enable site3,site4
```

Omit `--disable` or `--enable` when that list is empty.

The command moves each object between `content/json/items.json` and `content/json/items-disabled.json`, parks or restores that id's images, rebuilds `content/json/data.json`, then parks or restores that id's SWF compare records and rebuilds `www-root/public/swf-compare/index.html`.

Disable removes every link to that id from `content/json/main.json`. On that straight move, the parked object may gain optional `menu_positions`: a list of menu paths only, such as `[["websites"]]`, with no item ids. Enable appends the id to those menus and strips `menu_positions`. When `menu_positions` is missing, enable appends the id to the first menu. Edit `main.json` by hand if that slot should change.

Portfolio images are `{id}.jpg` and `{id}_{n}.jpg`. After the menu change, every jpg in `content/img` whose id is not in `main.json` moves to `content/img-disabled`. A jpg already parked there moves back when its id is in `main.json` again. The longest matching id wins, so `six_cds_1.jpg` stays with `six_cds`, `flickr_1.jpg` stays with `flickr`, and `mischief_1.jpg` belongs to `mischief_1`. `stump.png` and `curl-sprite.png` stay in `content/img`; the nav uses those files directly.

Each movie in `www-root/public/swf-compare/pages.json` has `itemId`, the portfolio data id. The matching catalog entry is in `www-root/src/lib/swf-compare-catalog.json`. Disable moves those records to `www-root/public/swf-compare-disabled/pages.json` and `catalog.json`, each with `before` set to the id that sat immediately in front of it. Enable moves them back to that slot. One id can own several movies, and every record with that `itemId` parks or returns together. The compiler then drops or recreates `/swf-compare/{id}/`. `lizard-site` is not a portfolio id, so that page stays. The command prints `swf compare parked`, `swf compare restored`, and `swf compare no page` for ids with no movie.

Reply with the ids that moved, any image files parked or restored, and those swf compare lines. If the command fails, report its message and leave the files as they were.
