import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DataSchema } from "./schema";
import rawData from "../../../../public/content/json/data.json";

const copiedDataPath = join(
  __dirname,
  "../../../public/content/json/data.json",
);

describe("DataSchema", () => {
  it("validates the production data.json without errors", () => {
    const result = DataSchema.safeParse(rawData);
    expect(result.success).toBe(true);
  });

  it("matches the copied public data.json Flash loads", () => {
    const copied = JSON.parse(readFileSync(copiedDataPath, "utf8"));
    expect(copied).toEqual(rawData);
  });

  it("rejects invalid data", () => {
    const result = DataSchema.safeParse({ invalid: true });
    expect(result.success).toBe(false);
  });
});
