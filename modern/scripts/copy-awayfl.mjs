import { existsSync, cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = join(root, "node_modules", "@awayfl", "awayfl-player");
const vendor = join(root, "vendor", "awayfl-builtins");
const target = join(root, "public", "awayfl");

if (!existsSync(join(pkg, "bundle", "awayfl-player.umd.js"))) {
  throw new Error(
    "AwayFL package missing. Run npm install before copy-awayfl.",
  );
}

mkdirSync(join(target, "builtins"), { recursive: true });

cpSync(
  join(pkg, "bundle", "awayfl-player.umd.js"),
  join(target, "awayfl-player.umd.js"),
);
cpSync(join(pkg, "builtins"), join(target, "builtins"), { recursive: true });

// npm omits the ABC catalogs; overlay the vendored copies from GitHub.
for (const name of ["builtin.abc", "playerglobal.abcs", "avmplus.abc"]) {
  cpSync(join(vendor, name), join(target, "builtins", name));
}

console.log("Copied AwayFL runtime to public/awayfl/");
