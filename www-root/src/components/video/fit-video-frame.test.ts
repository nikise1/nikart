import { describe, expect, it } from "vitest";
import { fitVideoFrame } from "./fit-video-frame";

describe("fitVideoFrame", () => {
  it("keeps the source size when the stage is larger", () => {
    expect(fitVideoFrame({ width: 640, height: 480 }, { width: 1400, height: 900 })).toEqual({
      width: 640,
      height: 480,
    });
  });

  it("keeps a non-4:3 source when the stage is larger", () => {
    expect(fitVideoFrame({ width: 592, height: 480 }, { width: 2000, height: 2000 })).toEqual({
      width: 592,
      height: 480,
    });
  });

  it("shrinks to the stage width and keeps the source ratio", () => {
    expect(fitVideoFrame({ width: 1280, height: 720 }, { width: 640, height: 900 })).toEqual({
      width: 640,
      height: 360,
    });
  });

  it("shrinks to the stage height when that is the tighter edge", () => {
    expect(fitVideoFrame({ width: 1280, height: 872 }, { width: 1200, height: 700 })).toEqual({
      width: 1028,
      height: 700,
    });
  });

  it("returns an empty frame when either box has no area", () => {
    expect(fitVideoFrame({ width: 640, height: 480 }, { width: 0, height: 400 })).toEqual({
      width: 0,
      height: 0,
    });
    expect(fitVideoFrame({ width: 0, height: 480 }, { width: 400, height: 400 })).toEqual({
      width: 0,
      height: 0,
    });
  });
});
