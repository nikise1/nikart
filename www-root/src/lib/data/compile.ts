import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  type ContentItem,
  DataSchema,
  ItemsFileSchema,
  type LocalizedString,
  MainFileSchema,
  type MenuSourceNode,
  type OtherText,
  OtherSchema,
  type SiteData,
} from "./schema.ts";

export class PortfolioCompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioCompileError";
  }
}

export interface PortfolioSources {
  main: unknown;
  items: unknown;
  other: unknown;
  /** Same shape as items.json. These ids stay out of the compiled tree. */
  disabled: unknown;
}

function zodMessage(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("\n");
}

function parseWith<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new PortfolioCompileError(`${label}\n${zodMessage(result.error)}`);
  }
  return result.data;
}

function normalizeLocalized(value: LocalizedString): LocalizedString {
  if (typeof value === "string") return value;
  return { en: value.en, es: value.es };
}

function normalizeItem(item: ContentItem): ContentItem {
  return {
    id: item.id,
    type: item.type,
    title: normalizeLocalized(item.title),
    ...(item.desc !== undefined ? { desc: normalizeLocalized(item.desc) } : {}),
    ...(item.imgs !== undefined ? { imgs: item.imgs } : {}),
    ...(item.url !== undefined
      ? {
          url: typeof item.url === "string" ? item.url : { en: item.url.en, es: item.url.es },
        }
      : {}),
    ...(item.launch !== undefined ? { launch: normalizeLocalized(item.launch) } : {}),
    ...(item.pop !== undefined ? { pop: item.pop } : {}),
  };
}

function normalizeOther(other: OtherText): OtherText {
  return {
    back: { en: other.back.en, es: other.back.es },
    high_spd: other.high_spd,
    high_txt: { en: other.high_txt.en, es: other.high_txt.es },
    low_spd: other.low_spd,
    low_txt: { en: other.low_txt.en, es: other.low_txt.es },
    quality: { en: other.quality.en, es: other.quality.es },
  };
}

function compileMenu(
  nodes: MenuSourceNode[],
  items: Map<string, ContentItem>,
  disabled: Set<string>,
  used: Set<string>,
  trail: string[],
): SiteData["menu"] {
  const compiled: SiteData["menu"] = [];
  for (const node of nodes) {
    if (typeof node === "string") {
      // The menu link stays put so enable can put the item back in this slot.
      if (disabled.has(node)) continue;
      const item = items.get(node);
      if (!item) {
        const where = trail.length > 0 ? trail.join("/") : "(root)";
        throw new PortfolioCompileError(`Menu ${where} links to unknown id "${node}"`);
      }
      used.add(node);
      compiled.push(normalizeItem(item));
      continue;
    }

    compiled.push({
      id: node.id,
      type: "men" as const,
      menu: compileMenu(node.menu, items, disabled, used, [...trail, node.id]),
      title: normalizeLocalized(node.title),
    });
  }
  return compiled;
}

/** Join the source documents into the nested portfolio tree. Disabled items are checked and left out. */
export function compilePortfolio(sources: PortfolioSources): SiteData {
  const main = parseWith(MainFileSchema, sources.main, "main.json");
  const items = parseWith(ItemsFileSchema, sources.items, "items.json");
  const disabledItems = parseWith(ItemsFileSchema, sources.disabled, "items-disabled.json");
  const other = parseWith(OtherSchema, sources.other, "other.json");
  const byId = new Map(items.map((item) => [item.id, item]));
  const disabled = new Set<string>();
  for (const item of disabledItems) {
    if (byId.has(item.id)) {
      throw new PortfolioCompileError(
        `Item "${item.id}" is in both items.json and items-disabled.json`,
      );
    }
    disabled.add(item.id);
  }
  const used = new Set<string>();
  const menu = compileMenu(main.menu, byId, disabled, used, []);
  const unused = items.filter((item) => !used.has(item.id)).map((item) => item.id);
  if (unused.length > 0) {
    throw new PortfolioCompileError(`Items not linked from the menu: ${unused.join(", ")}`);
  }

  const site = {
    success: main.success,
    id: main.id,
    title: main.title,
    type: main.type,
    menu,
    other: normalizeOther(other),
  };
  // Validate in place. Replacing `site` with the parsed copy can reorder keys
  // (`menu` before `title` on branches) and change the committed file.
  const result = DataSchema.safeParse(site);
  if (!result.success) {
    throw new PortfolioCompileError(`compiled data.json\n${zodMessage(result.error)}`);
  }
  return site;
}

/**
 * Pretty-print in the legacy PHP `json_encode` style the committed file already uses:
 * 4-space indent, `\/` slashes, and `\u00xx` for non-ASCII. No trailing newline.
 */
export function encodePortfolioJson(value: unknown): string {
  return encodeValue(value, 0);
}

function encodeValue(value: unknown, indent: number): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new PortfolioCompileError("Cannot encode a non-finite number");
    }
    return String(value);
  }
  if (typeof value === "string") return encodeString(value);
  if (Array.isArray(value)) return encodeArray(value, indent);
  if (typeof value === "object") return encodeObject(value, indent);
  throw new PortfolioCompileError(`Cannot encode ${typeof value}`);
}

function encodeString(value: string): string {
  let out = '"';
  for (let index = 0; index < value.length; index++) {
    const ch = value[index]!;
    const code = value.charCodeAt(index);
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "/") out += "\\/";
    else if (ch === "\b") out += "\\b";
    else if (ch === "\f") out += "\\f";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (code < 0x20 || code > 0x7f) out += `\\u${code.toString(16).padStart(4, "0")}`;
    else out += ch;
  }
  return `${out}"`;
}

function encodeArray(value: unknown[], indent: number): string {
  if (value.length === 0) return "[]";
  const pad = " ".repeat(indent + 4);
  const inner = value.map((item) => encodeValue(item, indent + 4)).join(`,\n${pad}`);
  return `[\n${pad}${inner}\n${" ".repeat(indent)}]`;
}

function encodeObject(value: object, indent: number): string {
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 0) return "{}";
  const pad = " ".repeat(indent + 4);
  const inner = keys
    .map((key) => `${encodeString(key)}: ${encodeValue(record[key], indent + 4)}`)
    .join(`,\n${pad}`);
  return `{\n${pad}${inner}\n${" ".repeat(indent)}}`;
}

export function portfolioJsonDir(repoRoot: string): string {
  return join(repoRoot, "content", "json");
}

export function loadPortfolioSources(dir: string): PortfolioSources {
  return {
    main: JSON.parse(readFileSync(join(dir, "main.json"), "utf8")) as unknown,
    items: JSON.parse(readFileSync(join(dir, "items.json"), "utf8")) as unknown,
    other: JSON.parse(readFileSync(join(dir, "other.json"), "utf8")) as unknown,
    disabled: JSON.parse(readFileSync(join(dir, "items-disabled.json"), "utf8")) as unknown,
  };
}

/** Compile the sources in `dir` and write `data.json` when the bytes changed. */
export function writeCompiledPortfolio(dir: string): string {
  const encoded = encodePortfolioJson(compilePortfolio(loadPortfolioSources(dir)));
  const dest = join(dir, "data.json");
  const current = existsSync(dest) ? readFileSync(dest, "utf8") : null;
  if (current !== encoded) writeFileSync(dest, encoded);
  return encoded;
}
