import { readlinkSync, symlinkSync, unlinkSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// @typescript/typescript6 depends on typescript@6 under the name @typescript/old,
// and that copy also ships a `tsc` bin. npm then points node_modules/.bin/tsc at
// TypeScript 6. Next and `npx tsc` should keep using the TypeScript 7 compiler.
const modernRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const binDir = join(modernRoot, "node_modules", ".bin");
const linkPath = join(binDir, "tsc");
const target = relative(binDir, join(modernRoot, "node_modules", "typescript", "bin", "tsc"));

let current = null;
try {
  current = readlinkSync(linkPath);
} catch {
  current = null;
}

if (current !== target) {
  try {
    unlinkSync(linkPath);
  } catch {
    // The link is absent on a fresh install.
  }
  symlinkSync(target, linkPath);
}
