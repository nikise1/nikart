import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, HEAD } from "./route";

const weedsPath = { path: ["games", "weeds", "weeds.swf"] };

function request(method: "GET" | "HEAD" = "GET"): Request {
  return new Request("http://localhost/static/games/weeds/weeds.swf", {
    method,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /static/[...path]", () => {
  it("returns 400 for a parent-directory segment", async () => {
    const response = await GET(request(), {
      params: Promise.resolve({ path: ["games", "..", "weeds.swf"] }),
    });
    expect(response.status).toBe(400);
  });

  it("buffers origin bytes and sets content-length", async () => {
    const bytes = new Uint8Array([0x46, 0x57, 0x53, 0x0a]);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(bytes, {
        status: 200,
        headers: { "content-type": "application/x-shockwave-flash" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(request(), {
      params: Promise.resolve(weedsPath),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://static.nikart.co.uk/games/weeds/weeds.swf",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/x-shockwave-flash",
    );
    expect(response.headers.get("content-length")).toBe(String(bytes.byteLength));
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it("returns 502 when the origin fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    const response = await GET(request(), {
      params: Promise.resolve(weedsPath),
    });
    expect(response.status).toBe(502);
  });
});

describe("HEAD /static/[...path]", () => {
  it("does not download a body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: {
          "content-type": "application/x-shockwave-flash",
          "content-length": "195790",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await HEAD(request("HEAD"), {
      params: Promise.resolve(weedsPath),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://static.nikart.co.uk/games/weeds/weeds.swf",
      expect.objectContaining({ method: "HEAD" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBe("195790");
    expect(await response.arrayBuffer()).toHaveProperty("byteLength", 0);
  });
});
