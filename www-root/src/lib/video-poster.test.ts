import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { videoPosterUrl } from "./video-poster";

describe("videoPosterUrl", () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  it("returns the poster URL only when the file exists", () => {
    const dir = mkdtempSync(join(tmpdir(), "poster-"));
    roots.push(dir);
    mkdirSync(dir, { recursive: true });

    expect(videoPosterUrl("web_poker", [dir])).toBeNull();

    writeFileSync(join(dir, "web_poker_poster.jpg"), "poster");
    expect(videoPosterUrl("web_poker", [dir])).toBe("/content/img/web_poker_poster.jpg");
    expect(videoPosterUrl("spark", [dir])).toBeNull();
  });
});
