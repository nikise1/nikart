/** iPhone, iPod, iPad, and iPadOS Safari when it claims to be a Mac. */
export function isIos(nav: {
  readonly userAgent: string;
  readonly platform: string;
  readonly maxTouchPoints: number;
}): boolean {
  if (/iPad|iPhone|iPod/.test(nav.userAgent)) return true;
  return nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
}
