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
if (synced.status === 0) process.exit(0);

restore(backup);
try {
  reverseImages(moves);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error("Image rollback failed");
}
process.exit(synced.status ?? 1);
