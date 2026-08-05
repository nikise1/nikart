import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { buildFlashVars, resolveFlashLangCode, getStaticFilesBase } from "./flash-config";

describe("flash-config", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe("getStaticFilesBase", () => {
    it("uses production static host outside development", () => {
      expect(getStaticFilesBase()).toBe("http://static.nikart.co.uk");
    });

    it("uses legacy relative static path in development", () => {
      process.env.NODE_ENV = "development";
      expect(getStaticFilesBase()).toBe("../static");
    });
  });

  describe("buildFlashVars", () => {
    it("returns legacy flashVars shape", () => {
      expect(buildFlashVars("en")).toEqual({
        dotracking: "yes",
        embedlang: "en",
        staticfilesstr: "http://static.nikart.co.uk",
      });
    });
  });

  describe("resolveFlashLangCode", () => {
    it("prefers explicit lang query param", () => {
      expect(resolveFlashLangCode("es", "en")).toBe("es");
    });

    it("falls back to locale cookie", () => {
      expect(resolveFlashLangCode(undefined, "es")).toBe("es");
    });

    it("defaults to en", () => {
      expect(resolveFlashLangCode(undefined, undefined)).toBe("en");
    });
  });
});
