import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PortfolioCompileError, writeCompiledPortfolio } from "./compile.ts";
import { ItemVisibilityError, moveItems, parseItemMoveArgs } from "./item-visibility.ts";

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

function writeItems(name: string, items: readonly ItemRecord[]): void {
  writeFileSync(join(contentDir, name), `${JSON.stringify(items, null, 4)}\n`);
}

try {
  const request = parseItemMoveArgs(process.argv.slice(2));
  const items = readItems("items.json");
  const disabled = readItems("items-disabled.json");
  const moved = moveItems(items, disabled, request);
  const previousItems = readFileSync(join(contentDir, "items.json"), "utf8");
  const previousDisabled = readFileSync(join(contentDir, "items-disabled.json"), "utf8");
  writeItems("items.json", moved.items);
  writeItems("items-disabled.json", moved.disabled);
  try {
    writeCompiledPortfolio(contentDir);
  } catch (error) {
    writeFileSync(join(contentDir, "items.json"), previousItems);
    writeFileSync(join(contentDir, "items-disabled.json"), previousDisabled);
    throw error;
  }
  if (moved.disabledIds.length > 0) console.log(`disabled: ${moved.disabledIds.join(", ")}`);
  if (moved.enabledIds.length > 0) console.log(`enabled: ${moved.enabledIds.join(", ")}`);
} catch (error) {
  if (error instanceof ItemVisibilityError || error instanceof PortfolioCompileError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
