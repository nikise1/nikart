import { type MainFile, type MenuPosition, type MenuSourceNode } from "./schema.ts";

export class ItemVisibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ItemVisibilityError";
  }
}

export interface ItemMoveRequest {
  disable: string[];
  enable: string[];
}

export interface DisabledRecord {
  id: string;
  menu_positions?: MenuPosition[];
}

export interface ItemMoveResult<T extends { id: string }> {
  items: T[];
  disabled: Array<T & DisabledRecord>;
  main: MainFile;
  disabledIds: string[];
  enabledIds: string[];
}

/** Parse `--disable id1,id2 --enable id3`. Either flag may be repeated or omitted. */
export function parseItemMoveArgs(argv: string[]): ItemMoveRequest {
  const disable: string[] = [];
  const enable: string[] = [];

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!;
    let flag: "disable" | "enable";
    let raw: string;
    if (arg === "--disable" || arg === "--enable") {
      flag = arg.slice(2) as "disable" | "enable";
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) {
        throw new ItemVisibilityError(`Missing ids after ${arg}`);
      }
      raw = next;
      index += 1;
    } else if (arg.startsWith("--disable=") || arg.startsWith("--enable=")) {
      flag = arg.startsWith("--disable=") ? "disable" : "enable";
      raw = arg.slice(arg.indexOf("=") + 1);
    } else {
      throw new ItemVisibilityError(`Unknown argument "${arg}"`);
    }

    const ids = raw.split(",").map((id) => id.trim());
    if (ids.length === 0 || ids.some((id) => id.length === 0)) {
      throw new ItemVisibilityError(`No ids given for --${flag}`);
    }
    for (const id of ids) {
      if (disable.includes(id) || enable.includes(id)) {
        throw new ItemVisibilityError(`Duplicate id "${id}"`);
      }
    }
    (flag === "disable" ? disable : enable).push(...ids);
  }

  if (disable.length === 0 && enable.length === 0) {
    throw new ItemVisibilityError("Name at least one id to disable or enable");
  }

  return { disable, enable };
}

function samePath(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((part, index) => part === right[index]);
}

/** Menu paths where this id is linked. One path per menu, with no neighboring item ids. */
function collectPositions(
  nodes: readonly MenuSourceNode[],
  path: string[],
  id: string,
): MenuPosition[] {
  const positions: MenuPosition[] = [];
  for (const node of nodes) {
    if (typeof node === "string") {
      if (node === id && !positions.some((existing) => samePath(existing, path))) {
        positions.push([...path]);
      }
      continue;
    }
    positions.push(...collectPositions(node.menu, [...path, node.id], id));
  }
  return positions;
}

function removeLinks(nodes: readonly MenuSourceNode[], ids: ReadonlySet<string>): MenuSourceNode[] {
  const next: MenuSourceNode[] = [];
  for (const node of nodes) {
    if (typeof node === "string") {
      if (!ids.has(node)) next.push(node);
      continue;
    }
    next.push({ ...node, menu: removeLinks(node.menu, ids) });
  }
  return next;
}

function findMenu(nodes: MenuSourceNode[], path: readonly string[]): MenuSourceNode[] | undefined {
  const [head, ...rest] = path;
  if (head === undefined) return nodes;
  const branch = nodes.find((node) => typeof node !== "string" && node.id === head);
  if (branch === undefined || typeof branch === "string") return undefined;
  return findMenu(branch.menu, rest);
}

function firstMenu(nodes: MenuSourceNode[]): MenuSourceNode[] {
  for (const node of nodes) {
    if (typeof node !== "string") return node.menu;
  }
  return nodes;
}

function appendLink(menu: MenuSourceNode[], id: string): void {
  if (menu.some((node) => node === id)) return;
  menu.push(id);
}

/** Append to each recorded menu. With no paths, or none of them left, use the first menu. */
function placeEnabled(
  main: MainFile,
  id: string,
  positions: readonly MenuPosition[] | undefined,
): void {
  const paths = positions ?? [];
  if (paths.length === 0) {
    appendLink(firstMenu(main.menu), id);
    return;
  }
  let placed = false;
  for (const path of paths) {
    const menu = findMenu(main.menu, path);
    if (menu === undefined) continue;
    appendLink(menu, id);
    placed = true;
  }
  if (!placed) appendLink(firstMenu(main.menu), id);
}

function withoutPositions<T extends DisabledRecord>(item: T): Omit<T, "menu_positions"> {
  const { menu_positions: _positions, ...rest } = item;
  return rest;
}

/**
 * Move item objects between the live list and the disabled list.
 * Disable drops every main.json link and may store menu paths on the parked object.
 * Enable appends the id to those menus, or to the first menu when `menu_positions` is missing.
 */
export function moveItems<T extends { id: string }>(
  items: readonly T[],
  disabled: readonly (T & DisabledRecord)[],
  main: MainFile,
  request: ItemMoveRequest,
): ItemMoveResult<T> {
  const { disable, enable } = request;
  const live = new Map(items.map((item) => [item.id, item]));
  const parked = new Map(disabled.map((item) => [item.id, item]));

  for (const id of disable) {
    if (parked.has(id) && !live.has(id)) {
      throw new ItemVisibilityError(`"${id}" is already disabled`);
    }
    if (!live.has(id)) throw new ItemVisibilityError(`Unknown id "${id}"`);
  }
  for (const id of enable) {
    if (live.has(id) && !parked.has(id)) {
      throw new ItemVisibilityError(`"${id}" is already enabled`);
    }
    if (!parked.has(id)) throw new ItemVisibilityError(`Unknown id "${id}"`);
  }

  const positionsById = new Map(disable.map((id) => [id, collectPositions(main.menu, [], id)]));
  const nextMain = structuredClone(main);
  nextMain.menu = removeLinks(nextMain.menu, new Set(disable));

  for (const id of enable) {
    placeEnabled(nextMain, id, parked.get(id)?.menu_positions);
  }

  const disableSet = new Set(disable);
  const enableSet = new Set(enable);
  const nextItems = items.filter((item) => !disableSet.has(item.id));
  const nextDisabled = disabled.filter((item) => !enableSet.has(item.id));
  for (const id of disable) {
    const source = live.get(id) as T & DisabledRecord;
    const rest = withoutPositions(source);
    const positions = positionsById.get(id) ?? [];
    nextDisabled.push(positions.length > 0 ? { ...rest, menu_positions: positions } : rest);
  }
  for (const id of enable) {
    const source = parked.get(id);
    if (source !== undefined) nextItems.push(withoutPositions(source) as T);
  }

  return {
    items: nextItems,
    disabled: nextDisabled,
    main: nextMain,
    disabledIds: disable,
    enabledIds: enable,
  };
}
