---
name: portfolio-items
description: >
  Enable or disable portfolio items when the user says "disable: id1, id2"
  and/or "enable: id3, id4". Moves those ids between content/json/items.json
  and content/json/items-disabled.json, then rebuilds data.json.
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

The command moves each object between `content/json/items.json` and `content/json/items-disabled.json`, then rebuilds `content/json/data.json`.

Disable removes every link to that id from `content/json/main.json`. On that straight move, the parked object may gain optional `menu_positions`: a list of menu paths only, such as `[["websites"]]`, with no item ids. Enable appends the id to those menus and strips `menu_positions`. When `menu_positions` is missing, enable appends the id to the first menu. Edit `main.json` by hand if that slot should change.

Reply with the ids that moved. If the command fails, report its message and leave the files as they were.
