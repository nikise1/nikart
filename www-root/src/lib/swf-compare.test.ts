import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  compareHrefForItem,
  compareHrefForSource,
  orderComparePieceIds,
  pieceMovieUrl,
  pieceMovieBase,
  pieceFillHref,
  piecePageHref,
  swfCompareSources,
} from "./swf-compare";
import { indexPages, loadDisabledItemIds } from "./swf-compare-index";

/** SWF header stage size, not the data.json popup window. */
const stageSizes: Record<string, { width: number; height: number }> = {
  "ar-heart": { width: 494, height: 370 },
  "ar-lizard": { width: 500, height: 375 },
  "avis-donde": { width: 500, height: 500 },
  ciudad: { width: 1024, height: 768 },
  "desafio-pacifico": { width: 1024, height: 768 },
  "lizard-site": { width: 750, height: 500 },
  "reading-leeds": { width: 520, height: 893 },
  "rockstars-divas": { width: 520, height: 620 },
  slate20: { width: 768, height: 586 },
  spaceship: { width: 500, height: 375 },
  weeds: { width: 640, height: 480 },
  whiplash: { width: 550, height: 400 },
};

const publicRoot = join(__dirname, "../../public");
const lizardHtml = readFileSync(join(publicRoot, "swf-compare/lizard-site/index.html"), "utf8");
const playersJs = readFileSync(join(publicRoot, "swf-compare/players.js"), "utf8");

describe("swf-compare", () => {
  it("sends a single-SWF menu item to its fill page", () => {
    expect(compareHrefForItem("rockstars_divas")).toBe(pieceFillHref("rockstars-divas"));
    expect(compareHrefForItem("whiplash")).toBe(pieceFillHref("whiplash"));
    expect(pieceFillHref("rockstars-divas")).toBe("/swf-compare/rockstars-divas/fill.html");
  });

  it("has no compare page for a disabled portfolio id", () => {
    for (const itemId of ["claro", "118aua", "escalera", "banners", "dataminh", "cats", "star"]) {
      expect(compareHrefForItem(itemId)).toBeNull();
      expect(swfCompareSources.some((piece) => piece.itemId === itemId)).toBe(false);
    }
  });

  it("maps an S3 wrapper URL to the fill page", () => {
    expect(compareHrefForSource("https://static.nikart.co.uk/games/whiplash/index.html")).toBe(
      pieceFillHref("whiplash"),
    );
    expect(
      compareHrefForSource("https://static.nikart.co.uk/websites/claro/index.html"),
    ).toBeNull();
    expect(
      compareHrefForSource("https://static.nikart.co.uk/banners/hellboy/index.html"),
    ).toBeNull();
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
    expect(piecePageHref("lizard-site")).toBe("/swf-compare/lizard-site/index.html");
    expect(pieceMovieUrl("lizard-site", "main.ruffle.swf")).toBe("/fl/main.ruffle.swf");
    expect(pieceMovieBase("lizard-site", "main.ruffle.swf")).toBe("/fl/");
  });

  it("loads the lizard movie from /fl without a document base", () => {
    expect(lizardHtml).not.toMatch(/<base\b/i);
    expect(lizardHtml).toContain('data-swf="/fl/main.ruffle.swf"');
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

  it("maps movie paths onto https://static.nikart.co.uk", () => {
    expect(pieceMovieUrl("ciudad", "games/ciudad_helm/Main.swf")).toBe(
      "https://static.nikart.co.uk/games/ciudad_helm/Main.swf",
    );
    expect(pieceMovieUrl("weeds", "/static/games/weeds/weeds.swf")).toBe(
      "https://static.nikart.co.uk/games/weeds/weeds.swf",
    );
    expect(pieceMovieUrl("claro", "http://static.nikart.co.uk/websites/claro/swf/claro.swf")).toBe(
      "https://static.nikart.co.uk/websites/claro/swf/claro.swf",
    );
    expect(pieceMovieBase("whiplash", "games/whiplash/whiplash_cmb.swf")).toBe(
      "https://static.nikart.co.uk/games/whiplash/",
    );
  });

  it("keeps catalog JSON order, with extra wrapper movies after that source", () => {
    expect(orderComparePieceIds(["whiplash", "ciudad", "lizard-site", "rockstars-divas"])).toEqual([
      "lizard-site",
      "rockstars-divas",
      "ciudad",
      "whiplash",
    ]);
  });

  it("lists index cards and piece prev/next in catalog JSON order", () => {
    const indexHtml = readFileSync(join(publicRoot, "swf-compare/index.html"), "utf8");
    const cardIds = [...indexHtml.matchAll(/data-piece="([^"]+)"/g)].map((match) => match[1]);
    const pieceRoot = join(publicRoot, "swf-compare");
    const existingIds = readdirSync(pieceRoot).filter(
      (id) => existsSync(join(pieceRoot, id, "index.html")) && id !== "pieces",
    );
    const pages = JSON.parse(readFileSync(join(pieceRoot, "pages.json"), "utf8")) as {
      id: string;
      itemId: string;
      group: string;
    }[];
    const listed = new Set(indexPages(pages, loadDisabledItemIds()).map((page) => page.id));
    const expected = orderComparePieceIds(existingIds);
    const groupOrder = ["site", "websites", "games", "3d", "banners"];
    const grouped: string[] = [];
    for (const group of groupOrder) {
      grouped.push(
        ...expected.filter((id) => {
          const source =
            swfCompareSources.find((item) => item.id === id) ??
            swfCompareSources.find((item) => id.startsWith(`${item.id}__`));
          return listed.has(id) && source?.group === group;
        }),
      );
    }
    expect(cardIds).toEqual(grouped);
    for (const page of pages) {
      if (!listed.has(page.id)) {
        expect(indexHtml).not.toContain(`data-piece="${page.id}"`);
      }
    }
    expect(cardIds.slice(0, 4)).toEqual(["lizard-site", "rockstars-divas", "ciudad", "avis-donde"]);

    const rockstarsHtml = readFileSync(
      join(publicRoot, "swf-compare/rockstars-divas/index.html"),
      "utf8",
    );
    expect(rockstarsHtml).toContain(
      'data-swf="https://static.nikart.co.uk/games/rockstars_divas/Main.swf"',
    );
    expect(rockstarsHtml).toContain(
      'data-base="https://static.nikart.co.uk/games/rockstars_divas/"',
    );
    expect(rockstarsHtml).not.toContain("/swf-compare/pieces/");
    expect(playersJs).not.toContain("/swf-compare/pieces/");
    const nextConfig = readFileSync(join(__dirname, "../../next.config.ts"), "utf8");
    expect(nextConfig).toContain('source: "/swf-compare/content/:path*"');
    expect(nextConfig).not.toContain("/swf-compare/pieces/");
    expect(nextConfig).toContain('source: "/swf-compare"');
    expect(nextConfig).toContain('destination: "/swf-compare/index.html"');

    expect(lizardHtml).toContain(
      'href="/swf-compare/rockstars-divas/index.html">Rockstars vs Divas →',
    );
    expect(lizardHtml).not.toContain("claro");

    const playersCss = readFileSync(join(publicRoot, "swf-compare/players.css"), "utf8");
    expect(playersCss).toContain("var(--swf-w");
    expect(playersCss).toContain(".stage.stage-fill");
    expect(playersCss).toContain(
      "min(100vw, calc(100vh * (var(--swf-w, 640) / var(--swf-h, 400))))",
    );
    expect(playersJs).toContain("w: size.width");
    expect(playersJs).toContain("next.width + 1, next.height + 1");
    expect(playersJs).toContain("function flashSelfHref(filename)");
    expect(playersJs).toContain('new URL("/fl/main.ruffle.swf", window.location.origin)');
    expect(playersJs).toContain("function fillStageSize(el)");
    expect(playersJs).toContain('el.dataset.fill === "1"');
    expect(playersJs).toContain('options.scale = "exactFit"');
    expect(playersJs).not.toContain("pane.clientWidth");
    expect(playersJs).not.toContain("function fillViewport()");

    expect(indexHtml).toContain('href="/swf-compare/lizard-site/index.html"');
    expect(indexHtml).toContain('href="/swf-compare/rockstars-divas/index.html"');
    expect(indexHtml).not.toContain('href="/swf-compare/claro/index.html"');
    expect(indexHtml).not.toContain('data-piece="banner-hellboy"');
    expect(indexHtml).not.toContain('href="lizard-site/index.html"');
    expect(indexHtml).not.toContain('href="rockstars-divas/index.html"');

    for (const id of expected) {
      const stage = stageSizes[id];
      expect(stage, id).toBeTruthy();
      const html = readFileSync(join(pieceRoot, id, "index.html"), "utf8");
      expect(html).toContain(`data-width="${stage?.width}"`);
      expect(html).toContain(`data-height="${stage?.height}"`);
      expect(html).toContain(`--swf-w: ${stage?.width}`);
      expect(html).toContain(`--swf-h: ${stage?.height}`);
      expect(html).toContain(`href="/swf-compare/${id}/fill.html"`);
      const fill = readFileSync(join(pieceRoot, id, "fill.html"), "utf8");
      expect(fill).toContain('data-fill="1"');
      expect(fill).toContain(`data-width="${stage?.width}"`);
      expect(fill).toContain(`data-height="${stage?.height}"`);
      expect(fill).toContain(`--swf-w: ${stage?.width}`);
      expect(fill).toContain(`--swf-h: ${stage?.height}`);
      expect(fill).toContain("data-background=");
      expect(fill).toContain("stage-fill");
      expect(fill).not.toContain("topnav");
    }

    for (const [index, id] of expected.entries()) {
      const html = readFileSync(join(pieceRoot, id, "index.html"), "utf8");
      const prev = expected[index - 1];
      const next = expected[index + 1];
      if (prev) {
        expect(html).toContain(`href="/swf-compare/${prev}/index.html"`);
      }
      if (next) {
        expect(html).toContain(`href="/swf-compare/${next}/index.html"`);
      }
    }
  });
});
