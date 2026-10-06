import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readContentJson, saveContentJson } from "./content-json-file";

const minimal = {
  success: true,
  id: "main",
  title: "Main",
  type: "main",
  menu: [
    { id: "spark", type: "vid", title: "Spark" },
    { id: "collapse", type: "vid", title: "Collapse" },
  ],
  other: {
    back: { en: "Back", es: "Atrás" },
    high_spd: "500K",
    high_txt: { en: "High", es: "Alto" },
    low_spd: "150K",
    low_txt: { en: "Low", es: "Bajo" },
    quality: { en: "Video quality", es: "Calidad de video" },
  },
};

describe("readContentJson", () => {
  it("reads the pretty repo-root source", () => {
    expect(readContentJson()).toMatchObject({ id: "main", type: "main" });
  });
});

describe("saveContentJson", () => {
  it("pretty-prints a valid document and does not sync when asked", () => {
    const filePath = join(mkdtempSync(join(tmpdir(), "content-json-")), "data.json");
    const result = saveContentJson(minimal, { filePath, sync: false });
    expect(result).toEqual({ ok: true });
    const text = readFileSync(filePath, "utf8");
    expect(text.startsWith("{\n    \"success\": true")).toBe(true);
    expect(text.endsWith("\n")).toBe(true);
    expect(readContentJson(filePath)).toEqual(minimal);
  });

  it("rejects a document that does not match the portfolio schema", () => {
    const filePath = join(mkdtempSync(join(tmpdir(), "content-json-")), "data.json");
    const result = saveContentJson({ invalid: true }, { filePath, sync: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
    }
    expect(() => readFileSync(filePath, "utf8")).toThrow();
  });
});
