import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@ruffle-rs/ruffle");
const target = join(root, "public", "ruffle");

mkdirSync(target, { recursive: true });

for (const file of readdirSync(source)) {
  if (
    file === "ruffle.js" ||
    file.endsWith(".wasm") ||
    file.startsWith("core.ruffle.")
  ) {
    cpSync(join(source, file), join(target, file));
  }
}

console.log("Copied Ruffle runtime to public/ruffle/");
