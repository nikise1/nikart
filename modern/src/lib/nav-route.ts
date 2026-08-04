/** next-intl usePathname() returns the path without the locale prefix (e.g. `/games`, not `/en/games`). */
export function isHomePath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length === 0;
}

export function contentPathSegments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

/** True when the target route is shallower than the current path (breadcrumb / back navigation). */
export function isNavBackNavigation(currentPathname: string, targetRoute: string): boolean {
  const currentDepth = contentPathSegments(currentPathname).length;
  const targetDepth = contentPathSegments(targetRoute).length;
  return targetDepth < currentDepth;
}
