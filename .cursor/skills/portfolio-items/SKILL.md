---
name: portfolio-items
description: >
  Enable or disable portfolio items when the user says "disable: id1, id2"
  and/or "enable: id3, id4". Moves those ids between content/json/items.json
  and content/json/items-disabled.json, parks portfolio jpgs whose id is
  absent from main.json in content/img-disabled, then rebuilds data.json.
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

The command moves each object between `content/json/items.json` and `content/json/items-disabled.json`, parks or restores that id's images, then rebuilds `content/json/data.json`.

Disable removes every link to that id from `content/json/main.json`. On that straight move, the parked object may gain optional `menu_positions`: a list of menu paths only, such as `[["websites"]]`, with no item ids. Enable appends the id to those menus and strips `menu_positions`. When `menu_positions` is missing, enable appends the id to the first menu. Edit `main.json` by hand if that slot should change.

Portfolio images are `{id}.jpg` and `{id}_{n}.jpg`. After the menu change, every jpg in `content/img` whose id is not in `main.json` moves to `content/img-disabled`. A jpg already parked there moves back when its id is in `main.json` again. The longest matching id wins, so `six_cds_1.jpg` stays with `six_cds`, `flickr_1.jpg` stays with `flickr`, and `mischief_1.jpg` belongs to `mischief_1`. `stump.png` and `curl-sprite.png` stay in `content/img`; the nav uses those files directly.

Reply with the ids that moved and any image files parked or restored. If the command fails, report its message and leave the files as they were.
