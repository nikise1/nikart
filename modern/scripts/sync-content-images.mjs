import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  renameSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const modernRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(modernRoot, "..", "public", "content", "img");
const dest = join(modernRoot, "public", "_generated", "img");
const staging = join(modernRoot, "public", "_generated", ".img-sync-staging");
const leftoverPublicImg = join(modernRoot, "public", "content", "img");

function kindAt(path) {
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      return "symlink";
    }
    if (stat.isDirectory()) {
      return "directory";
    }
    return "other";
  } catch {
    return "missing";
  }
}

function removePath(path) {
  const kind = kindAt(path);
  if (kind === "symlink") {
    unlinkSync(path);
    return;
  }
  if (kind !== "missing") {
    rmSync(path, { recursive: true, force: true });
  }
}

removePath(leftoverPublicImg);

if (!existsSync(source)) {
  console.log(
    "Legacy public/content/img not found; skipping image sync. On Vercel, enable “Include source files outside of the Root Directory in the Build Step”.",
  );
  process.exit(0);
}

mkdirSync(join(modernRoot, "public", "_generated"), { recursive: true });
rmSync(staging, { recursive: true, force: true });
cpSync(source, staging, { recursive: true, dereference: true });
removePath(dest);
renameSync(staging, dest);
console.log("Synced content images to modern/public/_generated/img");
