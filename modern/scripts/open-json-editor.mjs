import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const source = join(repoRoot, "public", "content", "json", "data.json");
const compact = JSON.stringify(JSON.parse(readFileSync(source, "utf8")));
const url =
  "https://jsoneditoronline.org/#left=json." +
  encodeURIComponent(compact) +
  "&left_mode=tree&panels=left";

console.log(url);

if (process.argv.includes("--open")) {
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = spawn(command, args, { stdio: "ignore", detached: true });
  child.unref();
}
