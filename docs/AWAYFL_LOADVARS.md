# AwayFL LoadVars `onData` patch

Local host patch plus notes for an upstream PR to [`awayfl/avm1`](https://github.com/awayfl/avm1). Does **not** edit `awayfl-player.umd.js`.

## What breaks on the lizard movie

`main.ruffle.swf` (Flash 8 / AVM1) loads catalog JSON like this:

```
jsonFetcher = new LoadVars();
jsonFetcher.onLoad = function (ok) { /* "Error connecting to server." */ };
jsonFetcher.onData = function (src) {
  jsonData = classes.JSON.parse(src);
  processData();
  dataLoaded = true;
};
jsonFetcher.load(pathContent + pathJSON); // ../content/json/data.json
```

Flash Player `LoadVars.onData(src)` is the raw-body hook. The default implementation URL-decodes `k=v&k=v` and then calls `onLoad`. JSON is not that format, so the movie **replaces** `onData`.

AwayFL already downloads the file (`[LOADER] Override loading url: /content/json/data.json`) and then broadcasts `onData`. The instance override never sticks, so `_root.dataLoaded` stays false and AwayFL sits on English / Español.

## Root cause (in `@awayfl/avm1`)

[`lib/lib/AVM1LoadVars.ts`](https://github.com/awayfl/avm1/blob/dev/lib/lib/AVM1LoadVars.ts) defines the prototype with `alDefineObjectProperties`:

```ts
onData: {
  value: this.defaultOnData,
},
```

[`alDefineObjectProperties`](https://github.com/awayfl/avm1/blob/dev/lib/runtime.ts) does `if (!desc.writable) flags |= READ_ONLY`. Omitted `writable` is therefore **READ_ONLY**.

`AVM1Object.alCanPut` then walks to that prototype slot and refuses the put. `jsonFetcher.onData = fn` is a silent no-op. `avm1BroadcastEvent(..., "onData", [loader.data])` runs `defaultOnData`, which `decode()`s `{...}` as form vars.

FP8 (this SWF is `playerVersion: 8`) is case-insensitive; the name to unlock is still `onData` / `ondata`.

## Local patch (this repo)

File: `modern/public/awayfl/loadvars-ondata-patch.js` (sibling of the UMD, not a UMD edit). The UMD and ABC copies under `public/awayfl/` are gitignored; this patch file stays in git.

Loaded by:

- compare kit `players.js` after `awayfl-player.umd.js`
- `/fl/away` via `AwayFlPlayer`

It wraps `AVMPlayer` construction (Proxy, not a UMD edit) so that on `avmComplete` (AVM1 globals exist, first frame has not run yet) it:

1. Wraps `alCanPut` so `onData` / `onLoad` / `onHTTPStatus` can be assigned on the instance.
2. Clears the `READ_ONLY` bit on those prototype descriptors if `LoadVars` is found.
3. Wraps `defaultOnData` to log if a JSON body still hits the default path.

Console:

- `[nikart] AwayFL LoadVars patch: installed on AVMPlayer`
- `[nikart] AwayFL LoadVars patch: alCanPut allows onData/onLoad/onHTTPStatus overrides`

If you still see `defaultOnData saw JSON; instance onData should have run instead`, the override never landed (or `classes.JSON.parse` is a separate AVM1 parser issue).

## Upstream PR for `awayfl/avm1`

Repo: [github.com/awayfl/avm1](https://github.com/awayfl/avm1) · default branch `dev` · package `@awayfl/avm1` (currently 0.2.181). Bundled into `@awayfl/awayfl-player`.

### 1. Minimal SWF repro

AS2, FP8:

```
var lv = new LoadVars();
lv.onData = function (src) {
  trace("onData:" + src.substr(0, 16));
};
lv.onLoad = function (ok) {
  trace("onLoad:" + ok);
};
lv.load("data.json"); // body is {"ok":true}
```

Expected in FP / Ruffle: `onData:{"ok":true`.  
AwayFL today: `onLoad:true` and no `onData` trace (or URL-decoded junk).

### 2. Code change

In `lib/lib/AVM1LoadVars.ts`, mark the event handler writable (same pattern as `constructor`):

```ts
onData: {
  value: this.defaultOnData,
  writable: true,
},
```

Optional follow-ups in the same PR or a second one:

- Same `writable: true` for any other LoadVars callback you put on the prototype later (`onLoad`, `onHTTPStatus`).
- In `alDefineObjectProperties`, treat omitted `writable` as `true` for DATA methods that Flash movies routinely replace, or document that event handlers must set `writable: true`.
- Keep `avm1BroadcastEvent(context, target, "onData", [loader.data])` passing the **string** body (`dataFormat = "text"`). Do not `decode()` first when an instance `onData` exists.

Do **not** special-case JSON inside `defaultOnData`. FP’s default is still URL-decode; JSON movies override `onData`.

### 3. Test

`package.json` has no test script. Smallest useful check:

- the SWF above, plus a `k=v` fixture that still hits `defaultOnData` / `onLoad(true)`
- assign `onData` then `load()`, assert the raw string
- assign nothing, load `a=1&b=2`, assert `alGet("a") === "1"`

Ruffle’s LoadVars tracking (`onData` overridable) is a good behaviour checklist: [ruffle-rs/ruffle#258](https://github.com/ruffle-rs/ruffle/issues/258).

### 4. Open the PR

1. Fork/clone `awayfl/avm1`, branch from `dev`.
2. Commit the `writable: true` change with a note that FP lets movies replace `LoadVars.onData` for non-form bodies.
3. PR against `dev`. Mention: AS2 `LoadVars` + JSON (or any raw `onData`) is broken because the prototype slot is `READ_ONLY`.
4. After merge, bump `@awayfl/avm1` and rebuild `@awayfl/awayfl-player`, then drop this host patch.

### 5. What this PR does not fix

If instance `onData` runs and `_root.dataLoaded` is still false, the next failure is `classes.JSON.parse` (the AS2 JSON.org port in `src/fl/classes/JSON.as`) inside AwayFL’s AVM1. That is a parser/throw issue, not LoadVars.
