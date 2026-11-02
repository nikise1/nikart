import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type CompareRecord,
  type ParkedCompare,
  launchPageMap,
  relocateCompare,
  replaceLaunchPages,
} from "./swf-compare-park";

interface Page extends CompareRecord {
  title: string;
}

interface Source extends CompareRecord {
  wrapper: string;
}

function page(id: string, itemId: string): Page {
  return { id, itemId, title: id };
}

function source(id: string, itemId: string, wrapper: string): Source {
  return { id, itemId, wrapper };
}

const pages = [
  page("lizard-site", "lizard-site"),
  page("claro", "claro"),
  page("118aua-energyball", "118aua"),
  page("118aua-livefeed", "118aua"),
  page("reading-leeds", "reading_leeds"),
  page("escalera", "escalera"),
  page("slate20", "slate20"),
  page("spaceship", "spaceship"),
  page("banner-hellboy", "banners"),
  page("banner-shell", "banners"),
  page("banner-shell__glasses", "banners"),
  page("banner-trunk__mpu_2", "banners"),
];

const catalog = [
  source("lizard-site", "lizard-site", "fl/main.swf"),
  source("claro", "claro", "websites/claro/index.html"),
  source("118aua-energyball", "118aua", "websites/118aua/energyball.html"),
  source("118aua-livefeed", "118aua", "websites/118aua/livefeed.html"),
  source("reading-leeds", "reading_leeds", "games/reading_leeds/index.html"),
  source("escalera", "escalera", "games/escalera/index.html"),
  source("slate20", "slate20", "games/slate20/index.html"),
  source("spaceship", "spaceship", "3d/papervision3d/spaceship/index.html"),
  source("banner-hellboy", "banners", "banners/hellboy/index.html"),
  source("banner-shell", "banners", "banners/shell/index.html"),
  source("banner-trunk", "banners", "banners/trunk/index.html"),
];

function ids(list: readonly { id: string }[]): string[] {
  return list.map((item) => item.id);
}

describe("relocateCompare", () => {
  it("parks every movie for a disabled portfolio id and remembers the previous id", () => {
    const moved = relocateCompare(pages, catalog, [], [], {
      disable: ["claro", "118aua", "escalera", "banners"],
      enable: [],
    });
    expect(ids(moved.livePages)).toEqual(["lizard-site", "reading-leeds", "slate20", "spaceship"]);
    expect(moved.parkedPages.map((row) => [row.before, row.item.id])).toEqual([
      ["lizard-site", "claro"],
      ["claro", "118aua-energyball"],
      ["118aua-energyball", "118aua-livefeed"],
      ["reading-leeds", "escalera"],
      ["spaceship", "banner-hellboy"],
      ["banner-hellboy", "banner-shell"],
      ["banner-shell", "banner-shell__glasses"],
      ["banner-shell__glasses", "banner-trunk__mpu_2"],
    ]);
    expect(ids(moved.liveCatalog)).toEqual([
      "lizard-site",
      "reading-leeds",
      "slate20",
      "spaceship",
    ]);
    expect(moved.parkedCatalog.map((row) => row.item.id)).toEqual([
      "claro",
      "118aua-energyball",
      "118aua-livefeed",
      "escalera",
      "banner-hellboy",
      "banner-shell",
      "banner-trunk",
    ]);
  });

  it("restores a later id before an earlier parked neighbour, then the neighbour in front", () => {
    const parked = relocateCompare(pages, catalog, [], [], {
      disable: ["claro", "118aua"],
      enable: [],
    });
    const aua = relocateCompare(
      parked.livePages,
      parked.liveCatalog,
      parked.parkedPages,
      parked.parkedCatalog,
      {
        disable: [],
        enable: ["118aua"],
      },
    );
    expect(ids(aua.livePages)).toEqual([
      "lizard-site",
      "118aua-energyball",
      "118aua-livefeed",
      "reading-leeds",
      "escalera",
      "slate20",
      "spaceship",
      "banner-hellboy",
      "banner-shell",
      "banner-shell__glasses",
      "banner-trunk__mpu_2",
    ]);
    const both = relocateCompare(
      aua.livePages,
      aua.liveCatalog,
      aua.parkedPages,
      aua.parkedCatalog,
      {
        disable: [],
        enable: ["claro"],
      },
    );
    expect(ids(both.livePages)).toEqual(ids(pages));
    expect(ids(both.liveCatalog)).toEqual(ids(catalog));
    expect(both.parkedPages).toEqual([]);
    expect(both.parkedCatalog).toEqual([]);
  });

  it("puts a single parked movie back between its neighbours", () => {
    const parked = relocateCompare(pages, catalog, [], [], {
      disable: ["escalera"],
      enable: [],
    });
    const restored = relocateCompare(
      parked.livePages,
      parked.liveCatalog,
      parked.parkedPages,
      parked.parkedCatalog,
      { disable: [], enable: ["escalera"] },
    );
    expect(ids(restored.livePages)).toEqual(ids(pages));
  });

  it("leaves an id with no compare page untouched", () => {
    const moved = relocateCompare(pages, catalog, [], [], {
      disable: ["dataminh"],
      enable: ["cats"],
    });
    expect(moved.livePages).toEqual(pages);
    expect(moved.parkedPages).toEqual([]);
  });
});

describe("launchPageMap", () => {
  it("maps HTML wrappers and skips the local lizard swf", () => {
    expect(launchPageMap(catalog, pages)).toEqual({
      "websites/claro/index.html": "claro",
      "websites/118aua/energyball.html": "118aua-energyball",
      "websites/118aua/livefeed.html": "118aua-livefeed",
      "games/reading_leeds/index.html": "reading-leeds",
      "games/escalera/index.html": "escalera",
      "games/slate20/index.html": "slate20",
      "3d/papervision3d/spaceship/index.html": "spaceship",
      "banners/hellboy/index.html": "banner-hellboy",
      "banners/shell/index.html": "banner-shell",
      "banners/trunk/index.html": "banner-trunk__mpu_2",
    });
  });

  it("rewrites LAUNCH_PAGES without touching the rest of players.js", () => {
    const source = `(() => {\n  const LAUNCH_PAGES = {\n    "old/index.html": "old",\n  };\n  function installFlashBridge() {}\n})();\n`;
    const next = replaceLaunchPages(source, catalog, pages);
    expect(next).toContain("function installFlashBridge() {}");
    expect(next).toContain('"banners/trunk/index.html": "banner-trunk__mpu_2"');
    expect(next).not.toContain("old/index.html");
    expect(next).not.toContain("fl/main.swf");
  });
});

describe("committed compare archive", () => {
  const root = join(__dirname, "../..");
  const livePages = JSON.parse(
    readFileSync(join(root, "public/swf-compare/pages.json"), "utf8"),
  ) as Page[];
  const liveCatalog = JSON.parse(
    readFileSync(join(root, "src/lib/swf-compare-catalog.json"), "utf8"),
  ) as Source[];
  const parkedPages = JSON.parse(
    readFileSync(join(root, "public/swf-compare-disabled/pages.json"), "utf8"),
  ) as ParkedCompare<Page>[];
  const parkedCatalog = JSON.parse(
    readFileSync(join(root, "public/swf-compare-disabled/catalog.json"), "utf8"),
  ) as ParkedCompare<Source>[];
  const playersJs = readFileSync(join(root, "public/swf-compare/players.js"), "utf8");

  it("keeps the removed movies out of the live compare set", () => {
    for (const itemId of ["claro", "118aua", "escalera", "banners"]) {
      expect(livePages.some((page) => page.itemId === itemId)).toBe(false);
      expect(liveCatalog.some((source) => source.itemId === itemId)).toBe(false);
    }
    expect(parkedPages.map((row) => row.item.id)).toEqual([
      "claro",
      "118aua-energyball",
      "118aua-livefeed",
      "escalera",
      "banner-standardlife",
      "banner-standardlife-lite",
      "banner-johnfrieda",
      "banner-hellboy",
      "banner-nintendo",
      "banner-shell",
      "banner-shell__glasses",
      "banner-shell__matchstick",
      "banner-trunk__mpu_2",
    ]);
  });

  it("restores the parked movies in their old order", () => {
    const restored = relocateCompare(livePages, liveCatalog, parkedPages, parkedCatalog, {
      disable: [],
      enable: ["claro", "118aua", "escalera", "banners"],
    });
    expect(ids(restored.livePages)).toEqual([
      "lizard-site",
      "claro",
      "118aua-energyball",
      "118aua-livefeed",
      "rockstars-divas",
      "ciudad",
      "avis-donde",
      "whiplash",
      "desafio-pacifico",
      "reading-leeds",
      "escalera",
      "slate20",
      "weeds",
      "ar-heart",
      "ar-lizard",
      "spaceship",
      "banner-standardlife",
      "banner-standardlife-lite",
      "banner-johnfrieda",
      "banner-hellboy",
      "banner-nintendo",
      "banner-shell",
      "banner-shell__glasses",
      "banner-shell__matchstick",
      "banner-trunk__mpu_2",
    ]);
    expect(restored.parkedPages).toEqual([]);
    expect(restored.parkedCatalog).toEqual([]);
    expect(replaceLaunchPages(playersJs, restored.liveCatalog, restored.livePages)).toContain(
      '"websites/claro/index.html": "claro"',
    );
  });

  it("matches the live launch map already written in players.js", () => {
    expect(replaceLaunchPages(playersJs, liveCatalog, livePages)).toBe(playersJs);
  });
});
