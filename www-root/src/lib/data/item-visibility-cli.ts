import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ItemVisibilityError, moveItems, parseItemMoveArgs } from "./item-visibility.ts";
import type { MainFile } from "./schema.ts";

const contentDir = join(dirname(fileURLToPath(import.meta.url)), "../../../../content/json");

interface ItemRecord {
  id: string;
}

function readItems(name: string): ItemRecord[] {
  const value: unknown = JSON.parse(readFileSync(join(contentDir, name), "utf8"));
  if (!Array.isArray(value)) {
    throw new ItemVisibilityError(`${name} must be an array`);
  }
  return value.map((item, index) => {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as { id?: unknown }).id !== "string"
    ) {
      throw new ItemVisibilityError(`${name}[${index}] needs a string id`);
    }
    return item as ItemRecord;
  });
}

function writeJson(name: string, value: unknown): void {
  writeFileSync(join(contentDir, name), `${JSON.stringify(value, null, 4)}\n`);
}

try {
  const request = parseItemMoveArgs(process.argv.slice(2));
  const items = readItems("items.json");
  const disabled = readItems("items-disabled.json");
  const main = JSON.parse(readFileSync(join(contentDir, "main.json"), "utf8")) as MainFile;
  const moved = moveItems(items, disabled, main, request);
  writeJson("items.json", moved.items);
  writeJson("items-disabled.json", moved.disabled);
  writeJson("main.json", moved.main);
  if (moved.disabledIds.length > 0) console.log(`disabled: ${moved.disabledIds.join(", ")}`);
  if (moved.enabledIds.length > 0) console.log(`enabled: ${moved.enabledIds.join(", ")}`);
} catch (error) {
  if (error instanceof ItemVisibilityError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
