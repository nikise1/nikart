import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

/** Cards whose pages.json itemId is one of these portfolio ids, in pages.json order. */
function swfCards(pages, ids) {
  const idSet = new Set(ids);
  return pages.filter((page) => idSet.has(page.itemId));
}

function reportSwfIndex(pages) {
  const disableIds = flagIds("--disable");
  const enableIds = flagIds("--enable");
  const removed = swfCards(pages, disableIds);
  const restored = swfCards(pages, enableIds);
  const linked = new Set(pages.map((page) => page.itemId));
  const unmatched = [...disableIds, ...enableIds].filter((id) => !linked.has(id));
  if (removed.length > 0) {
    console.log(`swf index removed: ${removed.map((page) => page.id).join(", ")}`);
  }
  if (restored.length > 0) {
    console.log(`swf index restored: ${restored.map((page) => page.id).join(", ")}`);
  }
  if (unmatched.length > 0) console.log(`swf index no page: ${unmatched.join(", ")}`);
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

const pages = JSON.parse(readFileSync(join(appRoot, "public/swf-compare/pages.json"), "utf8"));
const compiled = compileSwfIndex();
if (compiled.status !== 0) {
  restore(backup);
  try {
    reverseImages(moves);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error("Image rollback failed");
  }
  compileSwfIndex();
  process.exit(compiled.status ?? 1);
}
reportSwfIndex(pages);
process.exit(0);
