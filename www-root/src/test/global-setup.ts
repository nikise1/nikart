import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export default function setup() {
  const modernRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const result = spawnSync(process.execPath, ["scripts/compile-swf-compare.mjs"], {
    cwd: modernRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error("compile-swf-compare.mjs failed");
  }
}
