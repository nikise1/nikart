import { describe, it, expect } from "vitest";
import {
  toProxiedStaticUrl,
  isAwayFlLaunch,
  buildAwayFlPopupUrl,
  parsePopSize,
  parseFlashEmbed,
  siblingSwfCandidates,
} from "./awayfl-static";

describe("awayfl-static", () => {
  describe("toProxiedStaticUrl", () => {
    it("rewrites the S3 host to /static", () => {
      expect(
        toProxiedStaticUrl(
          "http://static.nikart.co.uk/websites/claro/index.html",
        ),
      ).toBe("/static/websites/claro/index.html");
    });

    it("rewrites the legacy relative static path", () => {
      expect(toProxiedStaticUrl("../static/games/whiplash/index.html")).toBe(
        "/static/games/whiplash/index.html",
      );
    });

    it("prefixes relative portfolio paths", () => {
      expect(toProxiedStaticUrl("websites/claro/index.html")).toBe(
        "/static/websites/claro/index.html",
      );
    });

    it("leaves unrelated absolute URLs alone", () => {
      expect(toProxiedStaticUrl("http://onedayinmay.co.uk")).toBeNull();
    });
  });

  describe("isAwayFlLaunch", () => {
    it("accepts Claro", () => {
      expect(
        isAwayFlLaunch("http://static.nikart.co.uk/websites/claro/index.html"),
      ).toBe(true);
    });

    it("rejects Shockwave Director files", () => {
      expect(
        isAwayFlLaunch(
          "http://static.nikart.co.uk/3d/shockwave3d/japanese.dcr",
        ),
      ).toBe(false);
    });

    it("rejects off-site URLs", () => {
      expect(isAwayFlLaunch("http://onedayinmay.co.uk")).toBe(false);
    });
  });

  describe("buildAwayFlPopupUrl", () => {
    it("builds the /fl/away popup query", () => {
      expect(
        buildAwayFlPopupUrl("websites/claro/index.html", {
          width: 960,
          height: 700,
          title: "claro",
        }),
      ).toBe(
        "/fl/away?src=websites%2Fclaro%2Findex.html&w=960&h=700&title=claro",
      );
    });
  });

  describe("parsePopSize", () => {
    it("reads legacy pop quotes", () => {
      expect(parsePopSize("'960','700','yes','yes','yes'")).toEqual({
        width: 960,
        height: 700,
      });
    });
  });

  describe("parseFlashEmbed", () => {
    it("parses Claro SWFObject 1.x", () => {
      const html = `
        var fo = new SWFObject("swf/claro.swf?base_url=", 'home', '100%', '100%', "9", '#FFFFFF')
        fo.addParam('scale', 'showAll');
        fo.write('flash');
      `;
      expect(
        parseFlashEmbed(html, "http://localhost/static/websites/claro/index.html"),
      ).toEqual({
        swfUrl: "/static/websites/claro/swf/claro.swf?base_url=",
        width: "100%",
        height: "100%",
        parameters: { base_url: "" },
        backgroundColor: "#FFFFFF",
      });
    });

    it("parses swfobject.embedSWF", () => {
      const html = `
        swfobject.embedSWF("whiplash_cmb.swf", "swf_container", "550", "400", "6.0.0", false, flashvars, params, attributes);
      `;
      expect(
        parseFlashEmbed(
          html,
          "http://localhost/static/games/whiplash/index.html",
        ),
      ).toEqual({
        swfUrl: "/static/games/whiplash/whiplash_cmb.swf",
        width: "550",
        height: "400",
        parameters: {},
      });
    });

    it("parses AC_FL_RunContent and skips the installer stub", () => {
      const html = `
        AC_FL_RunContent(
          "src", "playerProductInstall",
          "width", "100%",
          "height", "100%"
        );
        AC_FL_RunContent(
          "src", "Spaceship",
          "width", "100%",
          "height", "100%",
          "bgcolor", "#000000"
        );
      `;
      expect(
        parseFlashEmbed(
          html,
          "http://localhost/static/3d/papervision3d/spaceship/index.html",
        ),
      ).toEqual({
        swfUrl: "/static/3d/papervision3d/spaceship/Spaceship.swf",
        width: "100%",
        height: "100%",
        parameters: {},
        backgroundColor: "#000000",
      });
    });
  });

  describe("siblingSwfCandidates", () => {
    it("guesses Main.swf next to a splash HTML page", () => {
      expect(
        siblingSwfCandidates(
          "http://localhost/static/3d/away3d/ar_heart/index.html",
        ),
      ).toEqual([
        "/static/3d/away3d/ar_heart/Main.swf",
        "/static/3d/away3d/ar_heart/main.swf",
      ]);
    });
  });
});
