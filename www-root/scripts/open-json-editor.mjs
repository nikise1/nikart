import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const jsonDir = join(repoRoot, "content", "json");
const sources = ["main.json", "items.json", "items-disabled.json", "other.json"];
const urls = sources.map((name) => {
  const compact = JSON.stringify(JSON.parse(readFileSync(join(jsonDir, name), "utf8")));
  return (
    "https://jsoneditoronline.org/#left=json." +
    encodeURIComponent(compact) +
    "&left_mode=tree&panels=left"
  );
});

for (const [index, name] of sources.entries()) {
  console.log(`${name}\n${urls[index]}\n`);
}

if (process.argv.includes("--open")) {
  const command =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  for (const url of urls) {
    const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
    const child = spawn(command, args, { stdio: "ignore", detached: true });
    child.unref();
  }
}
