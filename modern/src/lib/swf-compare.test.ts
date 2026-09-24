import { describe, it, expect } from "vitest";
import {
  compareHrefForItem,
  compareHrefForSource,
  piecePageHref,
  staticMovieUrl,
} from "./swf-compare";

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

  it("maps movie paths onto the /static origin proxy", () => {
    expect(staticMovieUrl("games/ciudad_helm/Main.swf")).toBe(
      "/static/games/ciudad_helm/Main.swf",
    );
    expect(staticMovieUrl("/static/games/weeds/weeds.swf")).toBe(
      "/static/games/weeds/weeds.swf",
    );
    expect(
      staticMovieUrl("http://static.nikart.co.uk/websites/claro/swf/claro.swf"),
    ).toBe("/static/websites/claro/swf/claro.swf");
  });
});
