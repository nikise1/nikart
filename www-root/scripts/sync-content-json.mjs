import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileContentJson } from "./compile-content-json.mjs";

compileContentJson();

/** Drop insignificant whitespace. Keeps escapes inside strings. */
function minifyJson(json) {
  let out = "";
  let inStr = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (inStr) {
      out += ch;
      if (ch === "\\") {
        out += json[++i] ?? "";
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') {
      inStr = true;
      out += ch;
      continue;
    }
    if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
      continue;
    }
    out += ch;
  }
  return out;
}

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(appRoot, "..", "content", "json", "data.json");
const destDir = join(appRoot, "public", "content", "json");
const dest = join(destDir, "data.json");
const leftoverPretty = join(destDir, "data-pretty.json");

if (!existsSync(source)) {
  console.log(
    "Repo-root content/json/data.json not found; skipping JSON sync. On Vercel, enable “Include source files outside of the Root Directory in the Build Step”.",
  );
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
writeFileSync(dest, minifyJson(readFileSync(source, "utf8")));
if (existsSync(leftoverPretty)) {
  rmSync(leftoverPretty);
}
console.log("Synced content JSON to www-root/public/content/json/data.json");
