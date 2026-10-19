import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compilePortfolio, loadPortfolioSources } from "./compile";
import { ItemVisibilityError, moveItems, parseItemMoveArgs } from "./item-visibility";

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

describe("moveItems", () => {
  const sources = loadPortfolioSources(contentDir);
  const items = sources.items as { id: string }[];
  const disabled = sources.disabled as { id: string }[];

  it("moves ids between the two lists and keeps the ones that stay", () => {
    const before = items.map((item) => item.id);
    const claro = items.find((item) => item.id === "claro");
    const moved = moveItems(items, disabled, { disable: ["claro"], enable: ["stcharles"] });

    expect(moved.disabledIds).toEqual(["claro"]);
    expect(moved.enabledIds).toEqual(["stcharles"]);
    expect(moved.items.map((item) => item.id)).toEqual([
      ...before.filter((id) => id !== "claro"),
      "stcharles",
    ]);
    expect(moved.disabled.map((item) => item.id)).toEqual(["claro"]);
    expect(moved.disabled[0]).toBe(claro);
  });

  it("compiles the moved lists, skipping disabled menu links", () => {
    const moved = moveItems(items, disabled, { disable: ["claro"], enable: ["stcharles"] });
    const compiled = compilePortfolio({
      ...sources,
      items: moved.items,
      disabled: moved.disabled,
    });
    const websites = compiled.menu.find((node) => node.id === "websites");
    expect(websites && websites.type === "men" ? websites.menu.map((node) => node.id) : []).toEqual(
      expect.arrayContaining(["118aua", "stcharles", "terranova"]),
    );
    const websiteIds =
      websites && websites.type === "men" ? websites.menu.map((node) => node.id) : [];
    expect(websiteIds).not.toContain("claro");
    const ask = websiteIds.indexOf("118aua");
    expect(websiteIds[ask + 1]).toBe("stcharles");
    expect(websiteIds[ask + 2]).toBe("terranova");
  });

  it("rejects an unknown id and an id that is already in that state", () => {
    expect(() => moveItems(items, disabled, { disable: ["missing"], enable: [] })).toThrow(
      /Unknown id "missing"/,
    );
    expect(() => moveItems(items, disabled, { disable: ["stcharles"], enable: [] })).toThrow(
      /already disabled/,
    );
    expect(() => moveItems(items, disabled, { disable: [], enable: ["claro"] })).toThrow(
      /already enabled/,
    );
  });
});
