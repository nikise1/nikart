import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectMainIds, reconcilePortfolioImages } from "./item-images.ts";
import { ItemVisibilityError, moveItems, parseItemMoveArgs } from "./item-visibility.ts";
import type { MainFile } from "./schema.ts";

const contentDir = join(dirname(fileURLToPath(import.meta.url)), "../../../../content/json");
const imgDir = join(contentDir, "..", "img");
const imgDisabledDir = join(contentDir, "..", "img-disabled");

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

function reconcileMain(main: MainFile): void {
  const images = reconcilePortfolioImages(imgDir, imgDisabledDir, collectMainIds(main));
  if (images.parked.length > 0) console.log(`parked images: ${images.parked.join(", ")}`);
  if (images.restored.length > 0) console.log(`restored images: ${images.restored.join(", ")}`);
  console.log(`image-moves ${JSON.stringify(images)}`);
}

try {
  const argv = process.argv.slice(2);
  if (argv.includes("--images-only")) {
    if (argv.length !== 1) {
      throw new ItemVisibilityError("--images-only does not take other arguments");
    }
    const main = JSON.parse(readFileSync(join(contentDir, "main.json"), "utf8")) as MainFile;
    reconcileMain(main);
  } else {
    const request = parseItemMoveArgs(argv);
    const items = readItems("items.json");
    const disabled = readItems("items-disabled.json");
    const main = JSON.parse(readFileSync(join(contentDir, "main.json"), "utf8")) as MainFile;
    const moved = moveItems(items, disabled, main, request);
    writeJson("items.json", moved.items);
    writeJson("items-disabled.json", moved.disabled);
    writeJson("main.json", moved.main);
    if (moved.disabledIds.length > 0) console.log(`disabled: ${moved.disabledIds.join(", ")}`);
    if (moved.enabledIds.length > 0) console.log(`enabled: ${moved.enabledIds.join(", ")}`);
    reconcileMain(moved.main);
  }
} catch (error) {
  if (error instanceof ItemVisibilityError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
