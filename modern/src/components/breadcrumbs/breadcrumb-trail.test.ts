import { describe, expect, it } from "vitest";
import { diffBreadcrumbs, nextTrailSnapshot } from "./breadcrumb-trail";

describe("diffBreadcrumbs", () => {
  const art = { id: "art", title: "Art", path: "art" };
  const install = { id: "install", title: "Installations", path: "art/install" };
  const spark = { id: "spark", title: "Spark", path: "art/install/spark" };
  const games = { id: "games", title: "Games", path: "games" };

  it("treats a first trail as all added", () => {
    expect(diffBreadcrumbs([], [art, install])).toEqual({
      kept: [],
      removed: [],
      added: [art, install],
    });
  });

  it("adds only the new suffix when drilling down", () => {
    expect(diffBreadcrumbs([art, install], [art, install, spark])).toEqual({
      kept: [art, install],
      removed: [],
      added: [spark],
    });
  });

  it("removes only the dropped suffix when going up", () => {
    expect(diffBreadcrumbs([art, install, spark], [art])).toEqual({
      kept: [art],
      removed: [install, spark],
      added: [],
    });
  });

  it("replaces the branch when the prefix changes", () => {
    expect(diffBreadcrumbs([art, install, spark], [games])).toEqual({
      kept: [],
      removed: [art, install, spark],
      added: [games],
    });
  });

  it("keeps the same ids when only the title locale changes", () => {
    const artEs = { id: "art", title: "Arte", path: "art" };
    expect(diffBreadcrumbs([art], [artEs])).toEqual({
      kept: [artEs],
      removed: [],
      added: [],
    });
  });
});

describe("nextTrailSnapshot", () => {
  const art = { id: "art", title: "Art", path: "art" };
  const install = { id: "install", title: "Installations", path: "art/install" };
  const spark = { id: "spark", title: "Spark", path: "art/install/spark" };
  const games = { id: "games", title: "Games", path: "games" };

  it("marks only the new suffix as entering", () => {
    expect(nextTrailSnapshot([art, install], [art, install, spark])).toEqual({
      live: [art, install, spark],
      pendingAdded: [],
      visual: [
        { ...art, phase: "present" },
        { ...install, phase: "present" },
        { ...spark, phase: "entering" },
      ],
    });
  });

  it("marks only the dropped suffix as exiting", () => {
    expect(nextTrailSnapshot([art, install, spark], [art, install])).toEqual({
      live: [art, install],
      pendingAdded: [],
      visual: [
        { ...art, phase: "present" },
        { ...install, phase: "present" },
        { ...spark, phase: "exiting" },
      ],
    });
  });

  it("exits the old branch before entering the new one", () => {
    expect(nextTrailSnapshot([art, install], [games])).toEqual({
      live: [games],
      pendingAdded: [games],
      visual: [
        { ...art, phase: "exiting" },
        { ...install, phase: "exiting" },
      ],
    });
  });
});
