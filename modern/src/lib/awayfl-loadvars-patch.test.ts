import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const publicRoot = join(__dirname, "../../public");
const patch = readFileSync(
  join(publicRoot, "awayfl/loadvars-ondata-patch.js"),
  "utf8",
);
const playersJs = readFileSync(join(publicRoot, "swf-compare/players.js"), "utf8");

describe("AwayFL LoadVars onData host patch", () => {
  it("lives in a file next to the UMD, not inside awayfl-player.umd.js", () => {
    expect(patch).toContain("NikartAwayFlLoadVarsPatch");
    expect(patch).toContain("alCanPut allows onData/onLoad/onHTTPStatus");
    expect(patch).toContain("cleared READ_ONLY on LoadVars event handlers");
    expect(patch).not.toContain("awayfl-player.umd.js");
  });

  it("is loaded by the compare kit after the AwayFL UMD", () => {
    expect(playersJs).toContain(
      'const AWAYFL_LOADVARS_PATCH_SRC = "/awayfl/loadvars-ondata-patch.js"',
    );
    expect(playersJs).toContain("await loadScript(AWAYFL_SRC)");
    expect(playersJs).toContain("await loadScript(AWAYFL_LOADVARS_PATCH_SRC)");
    expect(playersJs).toContain("NikartAwayFlLoadVarsPatch?.install");
    expect(playersJs).toContain('src.endsWith("awayfl-player.umd.js")');
  });
});
