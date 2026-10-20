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

  it("keeps disabled items out of main and the compiled tree", () => {
    const items = sources.items as { id: string }[];
    const disabled = sources.disabled as { id: string; menu_positions?: { menu: string[] }[] }[];
    const main = sources.main as { menu: MenuSourceNode[] };
    expect(disabled.map((item) => item.id)).toEqual(["stcharles"]);
    expect(disabled[0]?.menu_positions?.[0]?.menu).toEqual(["websites"]);
    expect(items.some((item) => item.id === "stcharles")).toBe(false);
    expect(linkedIds(main.menu)).not.toContain("stcharles");
    const compiled = JSON.stringify(compilePortfolio(sources));
    expect(compiled).not.toContain("stcharles");
    expect(compiled).not.toContain("menu_positions");
  });

  it("rejects an id listed in both item files", () => {
    const items = structuredClone(sources.items) as { id: string }[];
    const disabled = sources.disabled as { id: string; menu_positions?: unknown }[];
    const { menu_positions: _positions, ...duplicate } = structuredClone(disabled[0]!);
    items.push(duplicate);
    expect(() => compilePortfolio({ ...sources, items })).toThrow(
      /both items.json and items-disabled.json/,
    );
  });

  it("rejects a menu link to a disabled id", () => {
    const main = structuredClone(sources.main) as { menu: MenuSourceNode[] };
    main.menu.push("stcharles");
    expect(() => compilePortfolio({ ...sources, main })).toThrow(/disabled id "stcharles"/);
  });

  it("rejects menu_positions on a live item and unknown keys on a disabled item", () => {
    const items = structuredClone(sources.items) as Record<string, unknown>[];
    items[0] = { ...items[0]!, menu_positions: [] };
    expect(() => compilePortfolio({ ...sources, items })).toThrow(/menu_positions/);
    const disabled = structuredClone(sources.disabled) as Record<string, unknown>[];
    disabled[0] = { ...disabled[0]!, extra: true };
    expect(() => compilePortfolio({ ...sources, disabled })).toThrow(/extra/);
  });
});
