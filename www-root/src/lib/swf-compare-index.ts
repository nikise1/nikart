import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const contentJson = join(dirname(fileURLToPath(import.meta.url)), "../../../content/json");

/** Index cards for movies whose portfolio id is still enabled. `itemId` is that id. */
export function indexPages<T extends { itemId: string }>(
  pages: readonly T[],
  disabledItemIds: ReadonlySet<string>,
): T[] {
  return pages.filter((page) => !disabledItemIds.has(page.itemId));
}

function disabledId(item: unknown): string | undefined {
  if (typeof item !== "object" || item === null || !("id" in item)) return undefined;
  const id = item.id;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

/** Portfolio ids in items-disabled.json. Pages with these itemIds stay off the compare index. */
export function loadDisabledItemIds(dir: string = contentJson): Set<string> {
  const path = join(dir, "items-disabled.json");
  if (!existsSync(path)) return new Set();
  const items: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(items)) {
    throw new Error(`${path} must be an array`);
  }
  const ids = new Set<string>();
  for (const item of items) {
    const id = disabledId(item);
    if (id !== undefined) ids.add(id);
  }
  return ids;
}
