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

The command moves each object between `content/json/items.json` and `content/json/items-disabled.json`, then rebuilds `content/json/data.json`. Menu links stay in `content/json/main.json`. A disabled id stays in that slot and is left out of the compiled site until it is enabled again.

Reply with the ids that moved. If the command fails, report its message and leave the files as they were.
