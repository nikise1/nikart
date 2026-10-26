import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { indexPages, loadDisabledItemIds } from "./swf-compare-index";

const pages = [
  { id: "lizard-site", itemId: "lizard-site" },
  { id: "claro", itemId: "claro" },
  { id: "118aua-energyball", itemId: "118aua" },
  { id: "118aua-livefeed", itemId: "118aua" },
  { id: "banner-hellboy", itemId: "banners" },
  { id: "banner-shell__glasses", itemId: "banners" },
];

describe("indexPages", () => {
  it("drops every movie linked to a disabled portfolio id", () => {
    expect(indexPages(pages, new Set(["118aua", "banners"])).map((page) => page.id)).toEqual([
      "lizard-site",
      "claro",
    ]);
  });

  it("keeps movies whose itemId is not a disabled portfolio id", () => {
    expect(indexPages(pages, new Set(["fl", "stcharles"])).map((page) => page.id)).toEqual(
      pages.map((page) => page.id),
    );
  });
});

describe("loadDisabledItemIds", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
    dirs.length = 0;
  });

  function writeDisabled(body: string): string {
    const dir = mkdtempSync(join(tmpdir(), "swf-index-"));
    dirs.push(dir);
    writeFileSync(join(dir, "items-disabled.json"), body);
    return dir;
  }

  it("reads portfolio ids and skips entries with no id", () => {
    const dir = writeDisabled('[{"id":"claro"},{"id":"banners"},{"nope":true},{"id":""}]\n');
    expect([...loadDisabledItemIds(dir)]).toEqual(["claro", "banners"]);
  });

  it("is empty when the file is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "swf-index-"));
    dirs.push(dir);
    expect(loadDisabledItemIds(dir).size).toBe(0);
  });

  it("rejects a non-array file", () => {
    const dir = writeDisabled("{}\n");
    expect(() => loadDisabledItemIds(dir)).toThrow(/must be an array/);
  });
});
