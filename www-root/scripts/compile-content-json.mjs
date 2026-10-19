import { realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Compile content/json/main.json + items.json + other.json into data.json. items-disabled.json stays out. */
export function compileContentJson() {
  const cli = join(appRoot, "src", "lib", "data", "compile-cli.ts");
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--disable-warning=ExperimentalWarning",
      "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      cli,
    ],
    { stdio: "inherit", cwd: appRoot },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(realpathSync(entry)).href) {
  compileContentJson();
}
