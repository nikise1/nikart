import { describe, expect, it } from "vitest";
import { isHomePath, isNavBackNavigation } from "./nav-route";

describe("isHomePath", () => {
  it("treats locale-less root as home", () => {
    expect(isHomePath("/")).toBe(true);
    expect(isHomePath("")).toBe(true);
  });

  it("does not treat top-level menu routes as home", () => {
    expect(isHomePath("/games")).toBe(false);
    expect(isHomePath("/featured")).toBe(false);
  });

  it("does not treat nested routes as home", () => {
    expect(isHomePath("/games/foo")).toBe(false);
  });
});

describe("isNavBackNavigation", () => {
  it("detects shallower target routes", () => {
    expect(isNavBackNavigation("/games/foo", "/games")).toBe(true);
    expect(isNavBackNavigation("/games/foo", "/")).toBe(true);
  });

  it("detects forward navigation", () => {
    expect(isNavBackNavigation("/", "/games")).toBe(false);
    expect(isNavBackNavigation("/games", "/games/foo")).toBe(false);
  });
});
