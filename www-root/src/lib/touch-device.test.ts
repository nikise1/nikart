import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TOUCH_DEVICE_QUERY, useTouchDevice } from "./touch-device";

function installMatchMedia(matches: boolean): void {
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", (query: string) => {
    expect(query).toBe(TOUCH_DEVICE_QUERY);
    return {
      matches,
      addEventListener: (_type: string, listener: () => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: () => void) => {
        listeners.delete(listener);
      },
    };
  });
}

describe("useTouchDevice", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads a finger-primary pointer", () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useTouchDevice());
    expect(result.current).toBe(true);
  });

  it("keeps a mouse", () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useTouchDevice());
    expect(result.current).toBe(false);
  });
});
