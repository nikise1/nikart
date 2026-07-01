import { describe, expect, it } from "vitest";
import { DataSchema } from "./schema";
import rawData from "../../../public/content/json/data-pretty.json";

describe("DataSchema", () => {
  it("validates the production data.json without errors", () => {
    const result = DataSchema.safeParse(rawData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid data", () => {
    const result = DataSchema.safeParse({ invalid: true });
    expect(result.success).toBe(false);
  });
});
