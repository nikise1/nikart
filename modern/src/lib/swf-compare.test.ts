import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  compareHrefForItem,
  compareHrefForSource,
  orderComparePieceIds,
  pieceMovieUrl,
  piecePageHref,
  swfCompareSources,
} from "./swf-compare";

const publicRoot = join(__dirname, "../../public");
const lizardHtml = readFileSync(
  join(publicRoot, "swf-compare/pieces/lizard-site/index.html"),
  "utf8",
);
const playersJs = readFileSync(join(publicRoot, "swf-compare/players.js"), "utf8");

describe("swf-compare", () => {
  it("sends a single-SWF menu item to its compare page", () => {
    expect(compareHrefForItem("claro")).toBe(piecePageHref("claro"));
    expect(compareHrefForItem("whiplash")).toBe(piecePageHref("whiplash"));
  });

  it("sends banner launches to the compare index", () => {
    expect(compareHrefForItem("banners")).toBe(
      "/swf-compare/index.html#banners",
    );
  });

  it("maps an S3 wrapper URL to the compare page", () => {
    expect(
      compareHrefForSource(
        "http://static.nikart.co.uk/websites/claro/index.html",
      ),
    ).toBe(piecePageHref("claro"));
  });

  it("ignores off-site URLs", () => {
    expect(compareHrefForSource("http://onedayinmay.co.uk")).toBeNull();
  });

  it("has a compare page for the legacy lizard Flash site", () => {
    const lizard = swfCompareSources.find((piece) => piece.id === "lizard-site");
    expect(lizard).toMatchObject({
      localSwf: "/fl/main.ruffle.swf",
      loaderUrl: "/fl/main.ruffle.swf",
      base: "/fl/",
    });
    expect(piecePageHref("lizard-site")).toBe(
      "/swf-compare/pieces/lizard-site/index.html",
    );
    expect(pieceMovieUrl("lizard-site", "main.ruffle.swf")).toBe(
      "/swf-compare/pieces/lizard-site/main.ruffle.swf",
    );
  });

  it("loads the lizard movie from the pieces copy without a document base", () => {
    expect(lizardHtml).not.toMatch(/<base\b/i);
    expect(lizardHtml).toContain(
      'data-swf="/swf-compare/pieces/lizard-site/main.ruffle.swf"',
    );
    expect(lizardHtml).toContain('data-base="/fl/"');
    expect(lizardHtml).toContain('data-loader-url="/fl/main.ruffle.swf"');
  });

  it("fetches each SWF once and starts AwayFL after Ruffle", () => {
    expect(playersJs).toContain("function movieBuffer(el)");
    expect(playersJs).toContain('el.dataset.player !== "ruffle"');
    expect(playersJs).toContain("data: new Uint8Array(buffer.slice(0))");
  });

  it("keeps per-page Ruffle/AwayFL visibility in localStorage", () => {
    expect(playersJs).toContain('const STORAGE_KEY = "swf-compare-pages"');
    expect(playersJs).toContain("function setPageVisible(id, player, visible)");
    expect(playersJs).toContain("function paintIndexCards()");
    expect(playersJs).toContain("/swf-compare/visibility-defaults.json");
  });

  it("rewrites AwayFL ../content LoadVars onto /content/", () => {
    expect(playersJs).toContain("function rewriteContentLoaderUrl(url)");
    expect(playersJs).toContain('url.includes("../content/")');
    expect(playersJs).toContain("redirects: awayFlRedirects(el)");
  });

  it("loads the LoadVars onData host patch after the AwayFL UMD", () => {
    expect(playersJs).toContain("/awayfl/loadvars-ondata-patch.js");
    expect(playersJs).toContain("NikartAwayFlLoadVarsPatch?.install");
  });

  it("maps movie paths onto the local /swf-compare/pieces/ copies", () => {
    expect(pieceMovieUrl("ciudad", "games/ciudad_helm/Main.swf")).toBe(
      "/swf-compare/pieces/ciudad/games/ciudad_helm/Main.swf",
    );
    expect(pieceMovieUrl("weeds", "/static/games/weeds/weeds.swf")).toBe(
      "/swf-compare/pieces/weeds/games/weeds/weeds.swf",
    );
    expect(
      pieceMovieUrl(
        "claro",
        "http://static.nikart.co.uk/websites/claro/swf/claro.swf",
      ),
    ).toBe("/swf-compare/pieces/claro/websites/claro/swf/claro.swf");
  });

  it("keeps catalog JSON order, with extra wrapper movies after that source", () => {
    expect(
      orderComparePieceIds([
        "banner-shell__matchstick",
        "claro",
        "lizard-site",
        "banner-shell",
        "118aua-energyball",
      ]),
    ).toEqual([
      "lizard-site",
      "claro",
      "118aua-energyball",
      "banner-shell",
      "banner-shell__matchstick",
    ]);
  });

  it("lists index cards and piece prev/next in catalog JSON order", () => {
    const indexHtml = readFileSync(
      join(publicRoot, "swf-compare/index.html"),
      "utf8",
    );
    const cardIds = [
      ...indexHtml.matchAll(/data-piece="([^"]+)"/g),
    ].map((match) => match[1]);
    const pieceRoot = join(publicRoot, "swf-compare/pieces");
    const existingIds = readdirSync(pieceRoot).filter((id) =>
      existsSync(join(pieceRoot, id, "index.html")),
    );
    const expected = orderComparePieceIds(existingIds);
    const groupOrder = ["site", "websites", "games", "3d", "banners"];
    const grouped: string[] = [];
    for (const group of groupOrder) {
      grouped.push(
        ...expected.filter((id) => {
          const source =
            swfCompareSources.find((item) => item.id === id) ??
            swfCompareSources.find((item) => id.startsWith(`${item.id}__`));
          return source?.group === group;
        }),
      );
    }
    expect(cardIds).toEqual(grouped);
    expect(cardIds.slice(0, 4)).toEqual([
      "lizard-site",
      "claro",
      "118aua-energyball",
      "118aua-livefeed",
    ]);

    expect(lizardHtml).toContain('href="../claro/index.html">Claro →');
    expect(lizardHtml).not.toContain("118aua-energyball");

    for (const [index, id] of expected.entries()) {
      const html = readFileSync(join(pieceRoot, id, "index.html"), "utf8");
      const prev = expected[index - 1];
      const next = expected[index + 1];
      if (prev) {
        expect(html).toContain(`href="../${prev}/index.html"`);
      }
      if (next) {
        expect(html).toContain(`href="../${next}/index.html"`);
      }
    }
  });
});
