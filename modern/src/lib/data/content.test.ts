import { describe, expect, it } from "vitest";
import {
  findById,
  findByPath,
  getBreadcrumbs,
  getContentItems,
  getPathTo,
  getSubMenus,
  getTopMenu,
  localize,
  localizeUrl,
} from "./content";
import type { MenuItem } from "./schema";

describe("localize", () => {
  it("returns a plain string unchanged", () => {
    expect(localize("Hello", "en")).toBe("Hello");
    expect(localize("Hello", "es")).toBe("Hello");
  });

  it("returns the correct locale from a locale map", () => {
    expect(localize({ en: "Games", es: "Juegos" }, "en")).toBe("Games");
    expect(localize({ en: "Games", es: "Juegos" }, "es")).toBe("Juegos");
  });

  it("returns empty string for undefined", () => {
    expect(localize(undefined, "en")).toBe("");
  });
});

describe("localizeUrl", () => {
  it("returns a plain string URL unchanged", () => {
    expect(localizeUrl("http://example.com", "en")).toBe("http://example.com");
  });

  it("returns the correct locale URL from a locale map", () => {
    const url = { en: "games/avis/en.html", es: "games/avis/es.html" };
    expect(localizeUrl(url, "en")).toBe("games/avis/en.html");
    expect(localizeUrl(url, "es")).toBe("games/avis/es.html");
  });

  it("returns undefined for undefined input", () => {
    expect(localizeUrl(undefined, "en")).toBeUndefined();
  });
});

describe("findByPath", () => {
  it("finds a top-level menu item", () => {
    const { node, breadcrumbs } = findByPath(["featured"]);
    expect(node).toBeDefined();
    expect(node!.id).toBe("featured");
    expect(breadcrumbs).toHaveLength(1);
  });

  it("finds a nested content item", () => {
    const { node, breadcrumbs } = findByPath(["games", "rockstars_divas"]);
    expect(node).toBeDefined();
    expect(node!.id).toBe("rockstars_divas");
    expect(breadcrumbs).toHaveLength(2);
  });

  it("finds a deeply nested item", () => {
    const { node } = findByPath(["art", "install", "spark"]);
    expect(node).toBeDefined();
    expect(node!.id).toBe("spark");
  });

  it("returns undefined for non-existent path", () => {
    const { node } = findByPath(["nonexistent"]);
    expect(node).toBeUndefined();
  });

  it("returns undefined for invalid nested path", () => {
    const { node } = findByPath(["featured", "nonexistent"]);
    expect(node).toBeUndefined();
  });
});

describe("findById", () => {
  it("finds a top-level item", () => {
    const node = findById("games");
    expect(node).toBeDefined();
    expect(node!.id).toBe("games");
  });

  it("finds a deeply nested item", () => {
    const node = findById("spark");
    expect(node).toBeDefined();
    expect(node!.id).toBe("spark");
  });

  it("returns undefined for non-existent ID", () => {
    expect(findById("nonexistent")).toBeUndefined();
  });
});

describe("getPathTo", () => {
  it("returns path to a top-level item", () => {
    expect(getPathTo("games")).toEqual(["games"]);
  });

  it("returns path to a nested item", () => {
    expect(getPathTo("spark")).toEqual(["art", "install", "spark"]);
  });

  it("returns undefined for non-existent ID", () => {
    expect(getPathTo("nonexistent")).toBeUndefined();
  });
});

describe("getContentItems", () => {
  it("returns only leaf nodes from a menu", () => {
    const gamesMenu = findById("games") as MenuItem;
    const items = getContentItems(gamesMenu);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.type !== "men")).toBe(true);
  });
});

describe("getSubMenus", () => {
  it("returns only menu nodes", () => {
    const artMenu = findById("art") as MenuItem;
    const subMenus = getSubMenus(artMenu);
    expect(subMenus.length).toBe(2); // install, vidart
    expect(subMenus.every((m) => m.type === "men")).toBe(true);
  });
});

describe("getTopMenu", () => {
  it("returns the root menu array", () => {
    const menu = getTopMenu();
    expect(menu.length).toBeGreaterThan(0);
    expect(menu[0]!.id).toBe("featured");
  });
});

describe("getBreadcrumbs", () => {
  it("generates breadcrumbs with localized titles", () => {
    const crumbs = getBreadcrumbs(["art", "install", "spark"], "en");
    expect(crumbs).toEqual([
      { id: "art", title: "Art", path: "art" },
      { id: "install", title: "Installations", path: "art/install" },
      { id: "spark", title: "Spark", path: "art/install/spark" },
    ]);
  });

  it("generates breadcrumbs in Spanish", () => {
    const crumbs = getBreadcrumbs(["art", "install"], "es");
    expect(crumbs).toEqual([
      { id: "art", title: "Arte", path: "art" },
      { id: "install", title: "Instalaciones", path: "art/install" },
    ]);
  });

  it("returns empty array for invalid path", () => {
    const crumbs = getBreadcrumbs(["nonexistent"], "en");
    expect(crumbs).toEqual([]);
  });
});
