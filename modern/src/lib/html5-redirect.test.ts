import { describe, expect, it } from "vitest";
import { redirectHtml5Home, redirectHtml5Lang } from "./html5-redirect";

describe("html5 redirects", () => {
  it("sends /html5 to / so locale middleware can pick the home", () => {
    const response = redirectHtml5Home(new Request("http://localhost/html5"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("redirects /html5/en to /en and sets the locale cookie", () => {
    const response = redirectHtml5Lang(new Request("http://localhost/html5/en"), "en");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/en");
    expect(response.headers.get("set-cookie")).toMatch(/NEXT_LOCALE=en/);
  });

  it("redirects /html5/es to /es and sets the locale cookie", () => {
    const response = redirectHtml5Lang(new Request("http://localhost/html5/es"), "es");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/es");
    expect(response.headers.get("set-cookie")).toMatch(/NEXT_LOCALE=es/);
  });
});
