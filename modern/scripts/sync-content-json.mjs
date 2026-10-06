import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const modernRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(modernRoot, "..", "public", "content", "json", "data.json");
const destDir = join(modernRoot, "public", "content", "json");
const dest = join(destDir, "data.json");
const prettyLeftover = join(destDir, "data-pretty.json");

if (!existsSync(source)) {
  console.log(
    "Legacy public/content/json/data.json not found; skipping JSON sync. On Vercel, enable “Include source files outside of the Root Directory in the Build Step”.",
  );
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
rmSync(prettyLeftover, { force: true });
copyFileSync(source, dest);
console.log("Synced content JSON to modern/public/content/json/data.json");
