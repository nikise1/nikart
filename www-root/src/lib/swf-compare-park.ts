export interface CompareRecord {
  id: string;
  itemId: string;
  wrapper?: string;
}

/** A compare record taken out of the live list, with the id that sat immediately before it. */
export interface ParkedCompare<T extends CompareRecord> {
  before: string | null;
  item: T;
}

export interface CompareLists<P extends CompareRecord, C extends CompareRecord> {
  livePages: P[];
  liveCatalog: C[];
  parkedPages: ParkedCompare<P>[];
  parkedCatalog: ParkedCompare<C>[];
}

interface CompareChange {
  disable: readonly string[];
  enable: readonly string[];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function parkList<T extends CompareRecord>(
  live: readonly T[],
  parked: readonly ParkedCompare<T>[],
  ids: ReadonlySet<string>,
): { live: T[]; parked: ParkedCompare<T>[] } {
  const nextParked = parked.map((row) => clone(row));
  const nextLive: T[] = [];
  const parkedIds = new Set(nextParked.map((row) => row.item.id));

  for (let index = 0; index < live.length; index += 1) {
    const item = live[index]!;
    if (!ids.has(item.itemId)) {
      nextLive.push(clone(item));
      continue;
    }
    if (parkedIds.has(item.id)) {
      throw new Error(`Compare id "${item.id}" is already parked`);
    }
    nextParked.push({ before: index === 0 ? null : live[index - 1]!.id, item: clone(item) });
    parkedIds.add(item.id);
  }

  return { live: nextLive, parked: nextParked };
}

function insertionIndex<T extends CompareRecord>(
  live: readonly T[],
  parked: readonly ParkedCompare<T>[],
  before: string | null,
): number {
  const placed = new Set(live.map((item) => item.id));
  let anchor = before;
  const seen = new Set<string>();
  while (anchor !== null && !placed.has(anchor)) {
    if (seen.has(anchor)) return live.length;
    seen.add(anchor);
    const earlier = parked.find((row) => row.item.id === anchor);
    if (earlier === undefined) return live.length;
    anchor = earlier.before;
  }
  if (anchor === null) return 0;
  return live.findIndex((item) => item.id === anchor) + 1;
}

function restoreList<T extends CompareRecord>(
  live: readonly T[],
  parked: readonly ParkedCompare<T>[],
  ids: ReadonlySet<string>,
): { live: T[]; parked: ParkedCompare<T>[] } {
  const nextLive = live.map((item) => clone(item));
  const staying = parked.filter((row) => !ids.has(row.item.itemId)).map((row) => clone(row));
  const moving = parked.filter((row) => ids.has(row.item.itemId));

  for (const row of moving) {
    if (nextLive.some((item) => item.id === row.item.id)) {
      throw new Error(`Compare id "${row.item.id}" is already live`);
    }
    const at = insertionIndex(nextLive, parked, row.before);
    nextLive.splice(at, 0, clone(row.item));
  }

  return { live: nextLive, parked: staying };
}

/** Move compare pages and catalog entries for portfolio ids between the live lists and the parked lists. */
export function relocateCompare<P extends CompareRecord, C extends CompareRecord>(
  livePages: readonly P[],
  liveCatalog: readonly C[],
  parkedPages: readonly ParkedCompare<P>[],
  parkedCatalog: readonly ParkedCompare<C>[],
  change: CompareChange,
): CompareLists<P, C> {
  const disable = new Set(change.disable);
  const enable = new Set(change.enable);
  const parked = parkList(livePages, parkedPages, disable);
  const parkedCatalogNext = parkList(liveCatalog, parkedCatalog, disable);
  const restoredPages = restoreList(parked.live, parked.parked, enable);
  const restoredCatalog = restoreList(parkedCatalogNext.live, parkedCatalogNext.parked, enable);
  return {
    livePages: restoredPages.live,
    liveCatalog: restoredCatalog.live,
    parkedPages: restoredPages.parked,
    parkedCatalog: restoredCatalog.parked,
  };
}

/** Wrapper path → compare page id, for the launch map inside players.js. */
export function launchPageMap(
  catalog: readonly CompareRecord[],
  pages: readonly CompareRecord[],
): Record<string, string> {
  const pageIds = new Set(pages.map((page) => page.id));
  const map: Record<string, string> = {};
  for (const source of catalog) {
    const wrapper = source.wrapper;
    if (wrapper === undefined || !wrapper.endsWith(".html")) continue;
    const direct = pageIds.has(source.id) ? source.id : undefined;
    const extra = pages.find((page) => page.id.startsWith(`${source.id}__`))?.id;
    const target = direct ?? extra;
    if (target !== undefined) map[wrapper] = target;
  }
  return map;
}

/** Replace the LAUNCH_PAGES object. Catalog order, HTML wrappers only. */
export function replaceLaunchPages(
  source: string,
  catalog: readonly CompareRecord[],
  pages: readonly CompareRecord[],
): string {
  const lines = Object.entries(launchPageMap(catalog, pages)).map(
    ([wrapper, id]) => `    "${wrapper}": "${id}",`,
  );
  const block = `  const LAUNCH_PAGES = {\n${lines.join("\n")}\n  };`;
  const pattern = / {2}const LAUNCH_PAGES = \{[\s\S]*?\n {2}\};/;
  if (!pattern.test(source)) {
    throw new Error("players.js is missing LAUNCH_PAGES");
  }
  return source.replace(pattern, block);
}
