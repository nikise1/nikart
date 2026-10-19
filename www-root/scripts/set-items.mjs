import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit", cwd: appRoot });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const cli = join(appRoot, "src", "lib", "data", "item-visibility-cli.ts");
run([
  "--experimental-strip-types",
  "--disable-warning=ExperimentalWarning",
  "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
  cli,
  ...process.argv.slice(2),
]);

// Minify the Flash copy. Compile already wrote content/json/data.json.
run([join(appRoot, "scripts", "sync-content-json.mjs")]);
