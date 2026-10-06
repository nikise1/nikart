import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

function get(file: string[]) {
  return GET(new Request("http://localhost/dev/vendor/jsoneditor"), {
    params: Promise.resolve({ file }),
  });
}

describe("jsoneditor vendor route", () => {
  it("is hidden outside next dev", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await get(["jsoneditor.min.js"]);
    expect(response.status).toBe(404);
  });

  it("serves the editor script in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await get(["jsoneditor.min.js"]);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("javascript");
    const text = await response.text();
    expect(text).toContain("JSONEditor");
  });

  it("rejects files outside the allowlist", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await get(["..", "package.json"]);
    expect(response.status).toBe(404);
  });
});
