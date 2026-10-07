import { describe, expect, it } from "vitest";
import { redirectFlLang } from "./fl-lang-redirect";

describe("redirectFlLang", () => {
  it("redirects /fl/en to /fl and sets the locale cookie", () => {
    const response = redirectFlLang(new Request("http://localhost/fl/en"), "en");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/fl");
    expect(response.headers.get("set-cookie")).toMatch(/NEXT_LOCALE=en/);
  });

  it("redirects /fl/es to /fl and sets the locale cookie", () => {
    const response = redirectFlLang(new Request("http://localhost/fl/es"), "es");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/fl");
    expect(response.headers.get("set-cookie")).toMatch(/NEXT_LOCALE=es/);
  });
});
