/** Nav animation timing constants — ported from legacy common.js */
export const NAV_TIMING = {
  staggerIn: 0.1,
  staggerOut: 0.075,
  growIn: 0.5,
  growOut: 0.5,
  itemIn: 1.2,
  itemOut: 0.5,
} as const;

export function itemsCloseDuration(numItems: number): number {
  return NAV_TIMING.itemOut + (numItems - 1) * NAV_TIMING.staggerOut;
}
