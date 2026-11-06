import { existsSync } from "node:fs";
import path from "node:path";
import { posterUrl } from "./assets";

/** Directories that can hold `{id}_poster.jpg`, dev source first. */
export function posterDirs(cwd = process.cwd()): string[] {
  return [path.join(cwd, "../content/img"), path.join(cwd, "public/_generated/img")];
}

/** Poster URL when `{id}_poster.jpg` is on disk, otherwise null. */
export function videoPosterUrl(id: string, dirs = posterDirs()): string | null {
  const name = `${id}_poster.jpg`;
  const found = dirs.some((dir) => existsSync(path.join(dir, name)));
  return found ? posterUrl(id) : null;
}
