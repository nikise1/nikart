import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compilePortfolio, encodePortfolioJson, loadPortfolioSources } from "./compile";
import { type MenuSourceNode, DataSchema } from "./schema";

const contentDir = join(__dirname, "../../../../content/json");
const committedPath = join(contentDir, "data.json");

function linkedIds(nodes: MenuSourceNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (typeof node === "string") ids.push(node);
    else ids.push(...linkedIds(node.menu));
  }
  return ids;
}

describe("encodePortfolioJson", () => {
  it("reprints the committed portfolio file byte for byte", () => {
    const committed = readFileSync(committedPath, "utf8");
    expect(encodePortfolioJson(JSON.parse(committed))).toBe(committed);
  });
});

describe("compilePortfolio", () => {
  const sources = loadPortfolioSources(contentDir);

  it("compiles main, items, and other into the committed data.json", () => {
    const committed = readFileSync(committedPath, "utf8");
    const compiled = compilePortfolio(sources);
    expect(DataSchema.safeParse(compiled).success).toBe(true);
    expect(encodePortfolioJson(compiled)).toBe(committed);
  });

  it("links the same content id from more than one menu", () => {
    const main = sources.main as { menu: MenuSourceNode[] };
    const items = sources.items as { id: string }[];
    const links = linkedIds(main.menu);
    for (const id of ["html5", "onedayinmay", "rockstars_divas", "ciudad"]) {
      expect(links.filter((link) => link === id).length).toBeGreaterThan(1);
      expect(items.filter((item) => item.id === id)).toHaveLength(1);
    }
  });

  it("rejects a menu link with no item", () => {
    const main = structuredClone(sources.main) as { menu: MenuSourceNode[] };
    main.menu.push("missing");
    expect(() => compilePortfolio({ ...sources, main })).toThrow(/unknown id "missing"/);
  });

  it("rejects a duplicate item id", () => {
    const items = structuredClone(sources.items) as { id: string }[];
    items.push(structuredClone(items[0]!));
    expect(() => compilePortfolio({ ...sources, items })).toThrow(/Duplicate item id/);
  });

  it("rejects an item that the menu does not link", () => {
    const items = structuredClone(sources.items) as unknown[];
    items.push({ id: "unused_item", type: "tex", title: "Unused" });
    expect(() => compilePortfolio({ ...sources, items })).toThrow(/unused_item/);
  });

  it("rejects an item field outside the compiled shape", () => {
    const items = structuredClone(sources.items) as Record<string, unknown>[];
    items[0] = { ...items[0]!, extra: true };
    expect(() => compilePortfolio({ ...sources, items })).toThrow(/extra/);
  });
});
