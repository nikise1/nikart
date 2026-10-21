import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsonDir = join(appRoot, "..", "content", "json");
const sources = ["items.json", "items-disabled.json", "main.json", "data.json"];

function run(args) {
  return spawnSync(process.execPath, args, { stdio: "inherit", cwd: appRoot });
}

const backup = new Map(
  sources.map((name) => {
    const path = join(jsonDir, name);
    return [name, existsSync(path) ? readFileSync(path, "utf8") : null];
  }),
);

const cli = join(appRoot, "src", "lib", "data", "item-visibility-cli.ts");
const moved = run([
  "--experimental-strip-types",
  "--disable-warning=ExperimentalWarning",
  "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
  cli,
  ...process.argv.slice(2),
]);
if (moved.status !== 0) process.exit(moved.status ?? 1);

const synced = run([join(appRoot, "scripts", "sync-content-json.mjs")]);
if (synced.status === 0) process.exit(0);

for (const [name, text] of backup) {
  if (text !== null) writeFileSync(join(jsonDir, name), text);
}
process.exit(synced.status ?? 1);
