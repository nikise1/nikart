import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compilePortfolio, loadPortfolioSources } from "./compile";
import {
  ItemVisibilityError,
  type DisabledRecord,
  moveItems,
  parseItemMoveArgs,
} from "./item-visibility";
import type { MainFile, MenuSourceNode } from "./schema";

const contentDir = join(__dirname, "../../../../content/json");

describe("parseItemMoveArgs", () => {
  it("reads comma-separated disable and enable lists", () => {
    expect(parseItemMoveArgs(["--disable", "site1, site2", "--enable", "site3,site4"])).toEqual({
      disable: ["site1", "site2"],
      enable: ["site3", "site4"],
    });
  });

  it("accepts equals form and repeated flags", () => {
    expect(parseItemMoveArgs(["--disable=site1", "--enable", "site3", "--enable=site4"])).toEqual({
      disable: ["site1"],
      enable: ["site3", "site4"],
    });
  });

  it("rejects an empty list, a duplicate, and an unknown flag", () => {
    expect(() => parseItemMoveArgs([])).toThrow(ItemVisibilityError);
    expect(() => parseItemMoveArgs(["--disable", "site1,,site2"])).toThrow(/No ids/);
    expect(() => parseItemMoveArgs(["--disable", "site1", "--enable", "site1"])).toThrow(
      /Duplicate id "site1"/,
    );
    expect(() => parseItemMoveArgs(["--nope"])).toThrow(/Unknown argument/);
  });
});

function linkedIds(nodes: readonly MenuSourceNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (typeof node === "string") ids.push(node);
    else ids.push(...linkedIds(node.menu));
  }
  return ids;
}

function menuIds(main: MainFile, id: string): string[] {
  const branch = main.menu.find((node) => typeof node !== "string" && node.id === id);
  if (branch === undefined || typeof branch === "string") return [];
  return branch.menu.map((node) => (typeof node === "string" ? node : node.id));
}

describe("moveItems", () => {
  const sources = loadPortfolioSources(contentDir);
  const items = sources.items as ({ id: string } & DisabledRecord)[];
  const disabled = sources.disabled as ({ id: string } & DisabledRecord)[];
  const main = sources.main as MainFile;

  it("removes a disabled id from main and stores its menu position", () => {
    const moved = moveItems(items, disabled, main, { disable: ["claro"], enable: [] });
    const claro = moved.disabled.find((item) => item.id === "claro");
    expect(claro?.menu_positions).toEqual([["websites"]]);
    expect(menuIds(moved.main, "websites")).not.toContain("claro");
    expect(linkedIds(moved.main.menu)).not.toContain("claro");
  });

  it("enables from menu_positions and strips that property", () => {
    const moved = moveItems(items, disabled, main, { disable: ["claro"], enable: ["stcharles"] });
    const stcharles = moved.items.find((item) => item.id === "stcharles");
    expect(stcharles).toBeDefined();
    expect(stcharles).not.toHaveProperty("menu_positions");
    const websiteIds = menuIds(moved.main, "websites");
    expect(websiteIds.at(-1)).toBe("stcharles");
    expect(websiteIds).not.toContain("claro");

    const compiled = compilePortfolio({
      ...sources,
      items: moved.items,
      disabled: moved.disabled,
      main: moved.main,
    });
    const compiledIds =
      compiled.menu.find((node) => node.id === "websites")?.type === "men"
        ? compiled.menu.find((node) => node.id === "websites" && node.type === "men")
        : undefined;
    const ids =
      compiledIds && compiledIds.type === "men" ? compiledIds.menu.map((node) => node.id) : [];
    expect(ids.at(-1)).toBe("stcharles");
    expect(ids).not.toContain("claro");
  });

  it("records every menu when an id is linked more than once", () => {
    const moved = moveItems(items, disabled, main, { disable: ["html5"], enable: [] });
    const html5 = moved.disabled.find((item) => item.id === "html5");
    expect(html5?.menu_positions).toEqual([["featured"], ["config"]]);
    expect(linkedIds(moved.main.menu)).not.toContain("html5");
    const restored = moveItems(moved.items, moved.disabled, moved.main, {
      disable: [],
      enable: ["html5"],
    });
    expect(menuIds(restored.main, "featured").at(-1)).toBe("html5");
    expect(menuIds(restored.main, "config").at(-1)).toBe("html5");
    expect(restored.items.find((item) => item.id === "html5")).not.toHaveProperty("menu_positions");
  });

  it("rejects an unknown id and an id already in that state", () => {
    expect(() => moveItems(items, disabled, main, { disable: ["missing"], enable: [] })).toThrow(
      /Unknown id "missing"/,
    );
    expect(() => moveItems(items, disabled, main, { disable: ["stcharles"], enable: [] })).toThrow(
      /already disabled/,
    );
    expect(() => moveItems(items, disabled, main, { disable: [], enable: ["claro"] })).toThrow(
      /already enabled/,
    );
  });

  it("appends to the first menu when menu_positions is missing", () => {
    const parked = [{ id: "plain", type: "tex", title: "Plain" }];
    const moved = moveItems([], parked, main, { disable: [], enable: ["plain"] });
    expect(menuIds(moved.main, "featured").at(-1)).toBe("plain");
    expect(moved.items.find((item) => item.id === "plain")).not.toHaveProperty("menu_positions");
  });
});
