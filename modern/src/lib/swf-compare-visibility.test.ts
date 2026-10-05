import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const publicRoot = join(__dirname, "../../public");
const playersSrc = readFileSync(join(publicRoot, "swf-compare/players.js"), "utf8");
const indexHtml = readFileSync(join(publicRoot, "swf-compare/index.html"), "utf8");
const claroHtml = readFileSync(
  join(publicRoot, "swf-compare/claro/index.html"),
  "utf8",
);
const visibilityDefaults = JSON.parse(
  readFileSync(join(publicRoot, "swf-compare/visibility-defaults.json"), "utf8"),
);

async function loadPlayers() {
  new Function(playersSrc)();
  await window.SwfCompare.ready;
}

describe("swf-compare player visibility", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    window.history.pushState({}, "", "/swf-compare/index.html");
    globalThis.fetch = async (url) => {
      if (String(url).includes("visibility-defaults.json")) {
        return {
          ok: true,
          json: async () => structuredClone(visibilityDefaults),
        };
      }
      throw new Error(`unexpected fetch ${url}`);
    };
  });

  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("uses committed defaults until localStorage overrides a page", async () => {
    await loadPlayers();
    const api = window.SwfCompare;
    expect(api.STORAGE_KEY).toBe("swf-compare-pages");
    expect(api.pieceIdFromPath("/swf-compare/claro/index.html")).toBe("claro");
    expect(api.pieceIdFromPath("/swf-compare/pieces/claro/index.html")).toBeNull();
    expect(api.pageState("claro")).toEqual({ ruffle: true, awayfl: false });
    expect(api.pageState("whiplash")).toEqual({ ruffle: false, awayfl: true });
    expect(api.pageState("ar-heart")).toEqual({ ruffle: false, awayfl: false });
    expect(api.pageState("banner-shell__matchstick")).toEqual({
      ruffle: true,
      awayfl: true,
    });
    api.setPageVisible("lizard-site", "ruffle", false);
    expect(JSON.parse(localStorage.getItem("swf-compare-pages") ?? "{}")).toEqual(
      {
        "lizard-site": { ruffle: false, awayfl: false },
      },
    );
  });

  it("paints index card visibilities from defaults", async () => {
    document.body.innerHTML = `
      <div class="card" data-piece="claro">
        <a href="claro/index.html">Claro</a>
        <span class="card-vis">
          <button type="button" class="vis is-on" data-vis="ruffle">Ruffle</button>
          <button type="button" class="vis is-on" data-vis="awayfl">AwayFL</button>
        </span>
      </div>`;
    await loadPlayers();
    expect(document.querySelector('[data-vis="ruffle"]')?.className).toContain(
      "is-on",
    );
    expect(document.querySelector('[data-vis="awayfl"]')?.className).toContain(
      "is-off",
    );
  });

  it("toggles index card flags without following the title link", async () => {
    document.body.innerHTML = `
      <div class="card" data-piece="claro">
        <a href="claro/index.html">Claro</a>
        <span class="card-vis">
          <button type="button" class="vis is-on" data-vis="ruffle">Ruffle</button>
          <button type="button" class="vis is-off" data-vis="awayfl">AwayFL</button>
        </span>
      </div>`;
    let followed = false;
    document.querySelector("a")?.addEventListener("click", () => {
      followed = true;
    });
    await loadPlayers();
    const ruffle = document.querySelector('[data-vis="ruffle"]');
    ruffle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(followed).toBe(false);
    expect(window.SwfCompare.pageState("claro")).toEqual({
      ruffle: false,
      awayfl: false,
    });
    expect(ruffle?.classList.contains("is-off")).toBe(true);
    expect(ruffle?.getAttribute("aria-pressed")).toBe("false");
  });

  it("toggles a pane with the Hide/Show button and skips loading hidden players", async () => {
    window.history.pushState({}, "", "/swf-compare/claro/index.html");
    document.body.innerHTML = `
      <section class="pane">
        <div class="pane-head">
          <h2>Ruffle</h2>
          <button type="button" class="vis-toggle" data-vis="ruffle">Hide</button>
        </div>
        <div class="stage" data-player="ruffle"></div>
      </section>
      <section class="pane">
        <div class="pane-head">
          <h2>AwayFL</h2>
          <button type="button" class="vis-toggle" data-vis="awayfl">Show</button>
        </div>
        <div class="stage" data-player="awayfl"></div>
      </section>`;
    await loadPlayers();
    const awayBtn = document.querySelector('[data-vis="awayfl"]');
    expect(
      document.querySelector('[data-player="awayfl"]')?.closest(".pane")
        ?.classList.contains("is-off"),
    ).toBe(true);
    expect(awayBtn?.textContent).toBe("Show");
    awayBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(window.SwfCompare.pageState("claro")).toEqual({
      ruffle: true,
      awayfl: true,
    });
    expect(
      document.querySelector('[data-player="awayfl"]')?.closest(".pane")
        ?.classList.contains("is-off"),
    ).toBe(false);
    expect(awayBtn?.textContent).toBe("Hide");
  });

  it("ships Hide buttons on piece pages and visibility marks on index cards", () => {
    expect(indexHtml).toContain('src="/swf-compare/players.js"');
    expect(indexHtml).toContain('data-piece="claro"');
    expect(indexHtml).toContain('class="vis is-on" data-vis="ruffle"');
    expect(indexHtml).toContain('class="vis is-off" data-vis="awayfl"');
    expect(indexHtml).toContain('data-piece="whiplash"');
    expect(claroHtml).toContain('class="vis-toggle" data-vis="ruffle"');
    expect(claroHtml).toContain(">Show</button>");
    expect(playersSrc).toContain("/swf-compare/visibility-defaults.json");
  });
});

declare global {
  interface Window {
    SwfCompare: {
      STORAGE_KEY: string;
      pieceIdFromPath: (pathname: string) => string | null;
      pageState: (id: string) => { ruffle: boolean; awayfl: boolean };
      setPageVisible: (id: string, player: string, visible: boolean) => void;
      paintIndexCards: () => void;
      ready: Promise<void>;
    };
  }
}
