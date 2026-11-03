/**
 * One browsing-context name for every portfolio web launch.
 * `_blank` opens a fresh tab on each click. `rel="noopener"` and
 * assigning `window.opener = null` do the same in Chrome: the name is
 * dropped, so the next launch cannot replace the previous tab.
 * A features string on `window.open` is a popup, which browsers block.
 */
export const WEB_TAB_NAME = "nikart-web";

/** Replace the shared tab. Returns null when the browser blocks the open. */
export function openWebTab(href: string): Window | null {
  const tab = window.open(href, WEB_TAB_NAME);
  tab?.focus();
  return tab;
}
