import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { relocateCompare, replaceLaunchPages } from "../src/lib/swf-compare-park.ts";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = join(appRoot, "..", "content");
const jsonDir = join(contentRoot, "json");
const imgDir = join(contentRoot, "img");
const imgDisabledDir = join(contentRoot, "img-disabled");
const sources = ["items.json", "items-disabled.json", "main.json", "data.json"];

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: appRoot,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"],
  });
  if (result.stdout) {
    const human = result.stdout
      .split("\n")
      .filter((line) => !line.startsWith("image-moves "))
      .join("\n");
    process.stdout.write(human);
  }
  return result;
}

function restore(backup) {
  for (const [name, text] of backup) {
    if (text !== null) writeFileSync(join(jsonDir, name), text);
  }
}

function imageMoves(stdout) {
  const line = stdout?.split("\n").find((entry) => entry.startsWith("image-moves "));
  if (line === undefined) return { parked: [], restored: [] };
  const value = JSON.parse(line.slice("image-moves ".length));
  return {
    parked: Array.isArray(value.parked) ? value.parked : [],
    restored: Array.isArray(value.restored) ? value.restored : [],
  };
}

function flagIds(flag) {
  const ids = [];
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === flag) {
      const raw = args[index + 1] ?? "";
      index += 1;
      ids.push(
        ...raw
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id.length > 0),
      );
      continue;
    }
    const prefix = `${flag}=`;
    if (arg.startsWith(prefix)) {
      ids.push(
        ...arg
          .slice(prefix.length)
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id.length > 0),
      );
    }
  }
  return ids;
}

const comparePagesPath = join(appRoot, "public/swf-compare/pages.json");
const compareCatalogPath = join(appRoot, "src/lib/swf-compare-catalog.json");
const comparePlayersPath = join(appRoot, "public/swf-compare/players.js");
const parkedCompareDir = join(appRoot, "public/swf-compare-disabled");
const parkedPagesPath = join(parkedCompareDir, "pages.json");
const parkedCatalogPath = join(parkedCompareDir, "catalog.json");
const compareFiles = [
  comparePagesPath,
  compareCatalogPath,
  comparePlayersPath,
  parkedPagesPath,
  parkedCatalogPath,
];

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function snapshotCompare() {
  return new Map(
    compareFiles.map((path) => [path, existsSync(path) ? readFileSync(path, "utf8") : null]),
  );
}

function restoreCompare(backup) {
  for (const [path, text] of backup) {
    if (text !== null) writeFileSync(path, text);
  }
}

/** Park or restore compare pages and catalog entries for these portfolio ids. */
function relocateSwfCompare(disableIds, enableIds) {
  const livePages = readJson(comparePagesPath, []);
  const liveCatalog = readJson(compareCatalogPath, []);
  const parkedPages = readJson(parkedPagesPath, []);
  const parkedCatalog = readJson(parkedCatalogPath, []);
  const known = new Set(
    [
      ...livePages,
      ...liveCatalog,
      ...parkedPages.map((row) => row.item),
      ...parkedCatalog.map((row) => row.item),
    ]
      .map((item) => item.itemId)
      .filter((id) => typeof id === "string"),
  );
  const moved = relocateCompare(livePages, liveCatalog, parkedPages, parkedCatalog, {
    disable: disableIds,
    enable: enableIds,
  });
  writeJson(comparePagesPath, moved.livePages);
  writeJson(compareCatalogPath, moved.liveCatalog);
  writeJson(parkedPagesPath, moved.parkedPages);
  writeJson(parkedCatalogPath, moved.parkedCatalog);
  const players = readFileSync(comparePlayersPath, "utf8");
  writeFileSync(
    comparePlayersPath,
    replaceLaunchPages(players, moved.liveCatalog, moved.livePages),
  );

  const parkedBefore = new Set(parkedPages.map((row) => row.item.id));
  const parkedAfter = new Set(moved.parkedPages.map((row) => row.item.id));
  const added = moved.parkedPages.filter((row) => !parkedBefore.has(row.item.id));
  const restored = parkedPages.filter((row) => !parkedAfter.has(row.item.id));
  const unmatched = [...disableIds, ...enableIds].filter((id) => !known.has(id));
  if (added.length > 0)
    console.log(`swf compare parked: ${added.map((row) => row.item.id).join(", ")}`);
  if (restored.length > 0) {
    console.log(`swf compare restored: ${restored.map((row) => row.item.id).join(", ")}`);
  }
  if (unmatched.length > 0) console.log(`swf compare no page: ${unmatched.join(", ")}`);
}

function compileSwfIndex() {
  return run([
    "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
    join(appRoot, "scripts", "compile-swf-compare.mjs"),
  ]);
}

/** Put files back. Restored names return to img-disabled; parked names return to img. */
function reverseImages(moves) {
  mkdirSync(imgDir, { recursive: true });
  mkdirSync(imgDisabledDir, { recursive: true });
  for (const name of moves.restored) {
    renameSync(join(imgDir, name), join(imgDisabledDir, name));
  }
  for (const name of moves.parked) {
    renameSync(join(imgDisabledDir, name), join(imgDir, name));
  }
}

const backup = new Map(
  sources.map((name) => {
    const path = join(jsonDir, name);
    return [name, existsSync(path) ? readFileSync(path, "utf8") : null];
  }),
);

const nodeFlags = [
  "--experimental-strip-types",
  "--disable-warning=ExperimentalWarning",
  "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
];
const cli = join(appRoot, "src", "lib", "data", "item-visibility-cli.ts");
const args = process.argv.slice(2);
const imagesOnly = args.includes("--images-only");

const moved = run([...nodeFlags, cli, ...args]);
if (moved.status !== 0) {
  restore(backup);
  process.exit(moved.status ?? 1);
}
if (imagesOnly) process.exit(0);

const moves = imageMoves(moved.stdout);
const synced = run([join(appRoot, "scripts", "sync-content-json.mjs")]);
if (synced.status !== 0) {
  restore(backup);
  try {
    reverseImages(moves);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error("Image rollback failed");
  }
  process.exit(synced.status ?? 1);
}

const compareBackup = snapshotCompare();
try {
  relocateSwfCompare(flagIds("--disable"), flagIds("--enable"));
} catch (error) {
  restore(backup);
  restoreCompare(compareBackup);
  try {
    reverseImages(moves);
  } catch (rollbackError) {
    console.error(rollbackError instanceof Error ? rollbackError.message : rollbackError);
    console.error("Image rollback failed");
  }
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const compiled = compileSwfIndex();
if (compiled.status !== 0) {
  restore(backup);
  restoreCompare(compareBackup);
  try {
    reverseImages(moves);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error("Image rollback failed");
  }
  compileSwfIndex();
  process.exit(compiled.status ?? 1);
}
process.exit(0);
