import { cpSync, existsSync, lstatSync, mkdirSync, renameSync, rmSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(appRoot, "..", "content", "img");
const dest = join(appRoot, "public", "_generated", "img");
const staging = join(appRoot, "public", "_generated", ".img-sync-staging");
const leftoverPublicImg = join(appRoot, "public", "content", "img");

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
    "Repo-root content/img not found; skipping image sync. On Vercel, enable “Include source files outside of the Root Directory in the Build Step”.",
  );
  process.exit(0);
}

mkdirSync(join(appRoot, "public", "_generated"), { recursive: true });
rmSync(staging, { recursive: true, force: true });
cpSync(source, staging, { recursive: true, dereference: true });
removePath(dest);
renameSync(staging, dest);
console.log("Synced content images to www-root/public/_generated/img");
