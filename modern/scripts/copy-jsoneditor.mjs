import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const modernRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(modernRoot, "node_modules/jsoneditor/dist");
const dest = join(modernRoot, "public/dev/jsoneditor");

if (!existsSync(join(dist, "jsoneditor.min.js"))) {
  console.log("jsoneditor is not installed; skipping the editor asset copy.");
  process.exit(0);
}

mkdirSync(join(dest, "img"), { recursive: true });
cpSync(join(dist, "jsoneditor.min.js"), join(dest, "jsoneditor.min.js"));
cpSync(join(dist, "jsoneditor.min.css"), join(dest, "jsoneditor.min.css"));
cpSync(join(dist, "img/jsoneditor-icons.svg"), join(dest, "img/jsoneditor-icons.svg"));
console.log("Copied jsoneditor assets to modern/public/dev/jsoneditor");
