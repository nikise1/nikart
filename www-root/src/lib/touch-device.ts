"use client";

import { useSyncExternalStore } from "react";

/** Phones and tablets whose primary pointer is a finger. */
export const TOUCH_DEVICE_QUERY = "(hover: none) and (pointer: coarse)";

function subscribe(onStoreChange: () => void): () => void {
  const media = window.matchMedia(TOUCH_DEVICE_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function touchDeviceSnapshot(): boolean {
  return window.matchMedia(TOUCH_DEVICE_QUERY).matches;
}

export function useTouchDevice(): boolean {
  return useSyncExternalStore(subscribe, touchDeviceSnapshot, () => false);
}
