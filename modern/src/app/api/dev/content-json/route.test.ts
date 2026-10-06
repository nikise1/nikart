import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/content-json-file", () => ({
  isContentEditorEnabled: () => process.env.NODE_ENV === "development",
  readContentJson: () => ({ success: true, id: "main" }),
  saveContentJson: (value: unknown) =>
    value && typeof value === "object" && "id" in value
      ? { ok: true as const }
      : { ok: false as const, error: "id: required" },
}));

import { GET, PUT } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("content JSON route", () => {
  it("hides the file outside next dev", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await GET();
    expect(response.status).toBe(404);
  });

  it("returns the portfolio document in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, id: "main" });
  });

  it("rejects an invalid save", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await PUT(
      new Request("http://localhost/api/dev/content-json", {
        method: "PUT",
        body: "null",
        headers: { "content-type": "application/json" },
      }),
    );
    expect(response.status).toBe(400);
  });
});
