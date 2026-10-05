import { describe, it, expect } from "vitest";
import {
  imgUrl,
  imgSlideUrl,
  videoH264Url,
  videoWebmUrl,
  processUrl,
} from "./assets";

describe("assets", () => {
  describe("imgUrl", () => {
    it("returns correct thumbnail URL", () => {
      expect(imgUrl("onedayinmay")).toBe(
        "/content/img/onedayinmay.jpg",
      );
    });
  });

  describe("imgSlideUrl", () => {
    it("returns correct slide URL with index", () => {
      expect(imgSlideUrl("ciudad", 3)).toBe(
        "/content/img/ciudad_3.jpg",
      );
    });
  });

  describe("videoH264Url", () => {
    it("returns correct H264 video URL", () => {
      expect(videoH264Url("spark")).toBe(
        "https://static.nikart.co.uk/video_h264/spark.mp4",
      );
    });
  });

  describe("videoWebmUrl", () => {
    it("returns correct WebM video URL", () => {
      expect(videoWebmUrl("spark")).toBe(
        "https://static.nikart.co.uk/video_webm/spark.webm",
      );
    });
  });

  describe("processUrl", () => {
    it("handles _self/ prefix", () => {
      expect(processUrl("_self/../html5")).toEqual({
        href: "../html5",
        isSelf: true,
      });
    });

    it("handles relative URLs by prepending static base", () => {
      expect(processUrl("games/ciudad_helm/index.html")).toEqual({
        href: "https://static.nikart.co.uk/games/ciudad_helm/index.html",
        isSelf: false,
      });
    });

    it("passes through absolute http URLs", () => {
      expect(processUrl("http://onedayinmay.co.uk")).toEqual({
        href: "http://onedayinmay.co.uk",
        isSelf: false,
      });
    });

    it("passes through absolute https URLs", () => {
      expect(processUrl("https://example.com")).toEqual({
        href: "https://example.com",
        isSelf: false,
      });
    });
  });
});
