/** SWF header version to the Flash Player release that first used it. SWF 10 covers Player 10.0 and 10.1. */
const FLASH_PLAYER_FOR_SWF = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "10.2",
  12: "10.3",
  13: "11.0",
  14: "11.1",
  15: "11.2",
  16: "11.3",
  17: "11.4",
  18: "11.5",
  19: "11.6",
  20: "11.7",
  21: "11.8",
  22: "11.9",
  23: "12.0",
  24: "13.0",
};

export function cardVersionLabel(page) {
  if (!page?.swfVersion) {
    return "";
  }
  const player = FLASH_PLAYER_FOR_SWF[page.swfVersion] ?? String(page.swfVersion);
  const script = page.actionScript ? ` · AS${page.actionScript}` : "";
  return `SWF ${page.swfVersion} · Player ${player}${script}`;
}
