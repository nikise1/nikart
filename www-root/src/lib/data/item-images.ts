import { mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";
import { ItemVisibilityError } from "./item-visibility.ts";
import type { MainFile, MenuSourceNode } from "./schema.ts";

/** Slide files are `{id}_1.jpg`. The suffix is only an underscore and digits. */
const SLIDE_SUFFIX = /^_\d+$/;

export interface ImageMoveResult {
  parked: string[];
  restored: string[];
}

/** Every menu id and linked item id in `main.json`. */
export function collectMainIds(main: MainFile): string[] {
  const ids = new Set<string>();
  const walk = (nodes: readonly MenuSourceNode[]): void => {
    for (const node of nodes) {
      if (typeof node === "string") {
        ids.add(node);
        continue;
      }
      ids.add(node.id);
      walk(node.menu);
    }
  };
  walk(main.menu);
  return [...ids];
}

/**
 * Portfolio images are `{id}.jpg` and `{id}_{n}.jpg`.
 * The longest id wins, so `six_cds_1.jpg` belongs to `six_cds` and `flickr_1.jpg` belongs to `flickr`.
 * Png files are site chrome (`stump.png`, `curl-sprite.png`) and are not portfolio images.
 */
export function portfolioImageId(filename: string, ids: readonly string[]): string | null {
  if (!filename.endsWith(".jpg")) return null;
  const stem = filename.slice(0, -".jpg".length);
  let best: string | null = null;
  for (const id of ids) {
    if (id.length === 0) continue;
    const rest = stem.slice(id.length);
    const owns = stem === id || (stem.startsWith(id) && SLIDE_SUFFIX.test(rest));
    if (!owns) continue;
    if (best === null || id.length > best.length) best = id;
  }
  return best;
}

function jpgFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".jpg") && statSync(join(dir, name)).isFile())
    .sort();
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

interface Rename {
  from: string;
  to: string;
}

/**
 * Park jpgs whose id is absent from `ids` and restore parked jpgs whose id is present.
 * Non-jpg files stay where they are. A failed move is undone before the error is rethrown.
 */
export function reconcilePortfolioImages(
  imgDir: string,
  disabledDir: string,
  ids: readonly string[],
): ImageMoveResult {
  mkdirSync(disabledDir, { recursive: true });
  const parked: string[] = [];
  const restored: string[] = [];
  const done: Rename[] = [];

  const moveFile = (fromDir: string, toDir: string, name: string, label: string): void => {
    const from = join(fromDir, name);
    const to = join(toDir, name);
    if (isFile(to)) {
      throw new ItemVisibilityError(`${label} already has ${name}`);
    }
    renameSync(from, to);
    done.push({ from, to });
  };

  try {
    for (const name of jpgFiles(imgDir)) {
      if (portfolioImageId(name, ids) !== null) continue;
      moveFile(imgDir, disabledDir, name, "content/img-disabled");
      parked.push(name);
    }
    for (const name of jpgFiles(disabledDir)) {
      if (portfolioImageId(name, ids) === null) continue;
      moveFile(disabledDir, imgDir, name, "content/img");
      restored.push(name);
    }
  } catch (error) {
    for (const rename of done.reverse()) {
      renameSync(rename.to, rename.from);
    }
    throw error;
  }

  parked.sort();
  restored.sort();
  return { parked, restored };
}
