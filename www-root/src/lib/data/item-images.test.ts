import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadPortfolioSources } from "./compile";
import { collectMainIds, portfolioImageId, reconcilePortfolioImages } from "./item-images";
import type { MainFile } from "./schema";

const contentDir = join(__dirname, "../../../../content/json");
const imgDir = join(__dirname, "../../../../content/img");
const imgDisabledDir = join(__dirname, "../../../../content/img-disabled");

describe("portfolioImageId", () => {
  const ids = ["fl", "flickr", "mischief", "mischief_1", "mischief_2", "six", "six_cds"];

  it("gives a slide to the longest matching id", () => {
    expect(portfolioImageId("mischief_1.jpg", ids)).toBe("mischief_1");
    expect(portfolioImageId("mischief_2.jpg", ids)).toBe("mischief_2");
    expect(portfolioImageId("six_cds.jpg", ids)).toBe("six_cds");
    expect(portfolioImageId("six_cds_1.jpg", ids)).toBe("six_cds");
    expect(portfolioImageId("six_1.jpg", ids)).toBe("six");
    expect(portfolioImageId("flickr_1.jpg", ids)).toBe("flickr");
    expect(portfolioImageId("fl.jpg", ids)).toBe("fl");
  });

  it("leaves site chrome and unknown jpgs unmatched", () => {
    expect(portfolioImageId("stump.png", ids)).toBeNull();
    expect(portfolioImageId("curl-sprite.png", ["curl-sprite"])).toBeNull();
    expect(portfolioImageId("six_1.jpg", ["six_cds"])).toBeNull();
    expect(portfolioImageId("stcharles_3.jpg", ids)).toBeNull();
  });
});

describe("collectMainIds", () => {
  it("includes menu ids and linked item ids", () => {
    const main = {
      success: true,
      id: "main",
      title: "Main",
      type: "main",
      menu: [
        {
          id: "art",
          title: "Art",
          menu: [{ id: "vidart", title: "Video", menu: ["mischief_1"] }],
        },
        "contact",
      ],
    } as MainFile;
    expect(collectMainIds(main).sort()).toEqual(["art", "contact", "mischief_1", "vidart"]);
  });
});

describe("reconcilePortfolioImages", () => {
  it("parks jpgs whose id is absent and restores them when the id returns", () => {
    const root = mkdtempSync(join(tmpdir(), "item-images-"));
    const live = join(root, "img");
    const parked = join(root, "img-disabled");
    mkdirSync(live);
    for (const name of [
      "claro.jpg",
      "claro_1.jpg",
      "six.jpg",
      "six_1.jpg",
      "six_cds.jpg",
      "stump.png",
    ]) {
      writeFileSync(join(live, name), name);
    }

    const first = reconcilePortfolioImages(live, parked, ["claro", "six_cds"]);
    expect(first.parked).toEqual(["six.jpg", "six_1.jpg"]);
    expect(first.restored).toEqual([]);
    expect(readdirSync(live).sort()).toEqual([
      "claro.jpg",
      "claro_1.jpg",
      "six_cds.jpg",
      "stump.png",
    ]);
    expect(readdirSync(parked).sort()).toEqual(["six.jpg", "six_1.jpg"]);

    const second = reconcilePortfolioImages(live, parked, ["claro", "six", "six_cds"]);
    expect(second.restored).toEqual(["six.jpg", "six_1.jpg"]);
    expect(readdirSync(parked)).toEqual([]);
    expect(readdirSync(live).sort()).toEqual([
      "claro.jpg",
      "claro_1.jpg",
      "six.jpg",
      "six_1.jpg",
      "six_cds.jpg",
      "stump.png",
    ]);

    rmSync(root, { recursive: true, force: true });
  });

  it("undoes a move when the destination already has that file", () => {
    const root = mkdtempSync(join(tmpdir(), "item-images-"));
    const live = join(root, "img");
    const parked = join(root, "img-disabled");
    mkdirSync(live);
    mkdirSync(parked);
    writeFileSync(join(live, "orphan.jpg"), "orphan");
    writeFileSync(join(live, "six.jpg"), "live");
    writeFileSync(join(parked, "six.jpg"), "parked");

    expect(() => reconcilePortfolioImages(live, parked, [])).toThrow(/already has six\.jpg/);
    expect(readdirSync(live).sort()).toEqual(["orphan.jpg", "six.jpg"]);
    expect(readdirSync(parked)).toEqual(["six.jpg"]);
    expect(readFileSync(join(parked, "six.jpg"), "utf8")).toBe("parked");

    rmSync(root, { recursive: true, force: true });
  });
});

describe("content image folders", () => {
  const ids = collectMainIds(loadPortfolioSources(contentDir).main as MainFile);

  it("keeps a jpg in content/img only when its id is in main.json", () => {
    for (const name of readdirSync(imgDir)) {
      if (!name.endsWith(".jpg")) continue;
      expect(portfolioImageId(name, ids), name).not.toBeNull();
    }
    expect(readdirSync(imgDir)).toEqual(expect.arrayContaining(["stump.png", "curl-sprite.png"]));
  });

  it("keeps content/img-disabled jpgs off the main.json ids", () => {
    for (const name of readdirSync(imgDisabledDir)) {
      if (!name.endsWith(".jpg")) continue;
      expect(portfolioImageId(name, ids), name).toBeNull();
    }
  });
});
