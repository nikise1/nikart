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

export interface ItemMoveResult<T extends { id: string }> {
  items: T[];
  disabled: T[];
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

/**
 * Move item objects between the live list and the disabled list.
 * Order of ids that stay put is unchanged. Moved ids append in the requested order.
 */
export function moveItems<T extends { id: string }>(
  items: readonly T[],
  disabled: readonly T[],
  request: ItemMoveRequest,
): ItemMoveResult<T> {
  const { disable, enable } = request;
  const overlap = disable.filter((id) => enable.includes(id));
  if (overlap.length > 0) {
    throw new ItemVisibilityError(`Listed in both disable and enable: ${overlap.join(", ")}`);
  }

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

  const disableSet = new Set(disable);
  const enableSet = new Set(enable);
  const nextItems = items.filter((item) => !disableSet.has(item.id));
  const nextDisabled = disabled.filter((item) => !enableSet.has(item.id));
  for (const id of disable) nextDisabled.push(live.get(id)!);
  for (const id of enable) nextItems.push(parked.get(id)!);

  return {
    items: nextItems,
    disabled: nextDisabled,
    disabledIds: disable,
    enabledIds: enable,
  };
}
