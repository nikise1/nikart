import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const publicRoot = join(__dirname, "../../public");
const playersSrc = readFileSync(join(publicRoot, "swf-compare/players.js"), "utf8");
const indexHtml = readFileSync(join(publicRoot, "swf-compare/index.html"), "utf8");
const claroHtml = readFileSync(
  join(publicRoot, "swf-compare/pieces/claro/index.html"),
  "utf8",
);

function loadPlayers() {
  new Function(playersSrc)();
}

describe("swf-compare player visibility", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    window.history.pushState({}, "", "/swf-compare/index.html");
  });

  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("stores one object keyed by page id in localStorage", () => {
    loadPlayers();
    const api = window.SwfCompare;
    expect(api.STORAGE_KEY).toBe("swf-compare-pages");
    expect(api.pieceIdFromPath("/swf-compare/pieces/claro/index.html")).toBe(
      "claro",
    );
    expect(api.pageState("claro")).toEqual({ ruffle: true, awayfl: true });
    api.setPageVisible("claro", "awayfl", false);
    api.setPageVisible("lizard-site", "ruffle", false);
    expect(JSON.parse(localStorage.getItem("swf-compare-pages") ?? "{}")).toEqual(
      {
        claro: { ruffle: true, awayfl: false },
        "lizard-site": { ruffle: false, awayfl: true },
      },
    );
  });

  it("paints index card visibilities from that store", () => {
    document.body.innerHTML = `
      <div class="card" data-piece="claro">
        <a href="pieces/claro/index.html">Claro</a>
        <span class="card-vis">
          <button type="button" class="vis is-on" data-vis="ruffle">Ruffle</button>
          <button type="button" class="vis is-on" data-vis="awayfl">AwayFL</button>
        </span>
      </div>`;
    loadPlayers();
    window.SwfCompare.setPageVisible("claro", "ruffle", false);
    window.SwfCompare.paintIndexCards();
    expect(document.querySelector('[data-vis="ruffle"]')?.className).toContain(
      "is-off",
    );
    expect(document.querySelector('[data-vis="awayfl"]')?.className).toContain(
      "is-on",
    );
  });

  it("toggles index card flags without following the title link", () => {
    document.body.innerHTML = `
      <div class="card" data-piece="claro">
        <a href="pieces/claro/index.html">Claro</a>
        <span class="card-vis">
          <button type="button" class="vis is-on" data-vis="ruffle">Ruffle</button>
          <button type="button" class="vis is-on" data-vis="awayfl">AwayFL</button>
        </span>
      </div>`;
    let followed = false;
    document.querySelector("a")?.addEventListener("click", () => {
      followed = true;
    });
    loadPlayers();
    const away = document.querySelector('[data-vis="awayfl"]');
    away?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(followed).toBe(false);
    expect(window.SwfCompare.pageState("claro")).toEqual({
      ruffle: true,
      awayfl: false,
    });
    expect(away?.classList.contains("is-off")).toBe(true);
    expect(away?.getAttribute("aria-pressed")).toBe("false");
  });

  it("toggles a pane with the Hide/Show button and skips loading hidden players", () => {
    window.history.pushState({}, "", "/swf-compare/pieces/claro/index.html");
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
          <button type="button" class="vis-toggle" data-vis="awayfl">Hide</button>
        </div>
        <div class="stage" data-player="awayfl"></div>
      </section>`;
    loadPlayers();
    const awayBtn = document.querySelector('[data-vis="awayfl"]');
    expect(awayBtn).toBeTruthy();
    awayBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(window.SwfCompare.pageState("claro")).toEqual({
      ruffle: true,
      awayfl: false,
    });
    expect(
      document.querySelector('[data-player="awayfl"]')?.closest(".pane")
        ?.classList.contains("is-off"),
    ).toBe(true);
    expect(awayBtn?.textContent).toBe("Show");
  });

  it("ships Hide buttons on piece pages and visibility marks on index cards", () => {
    expect(indexHtml).toContain('src="/swf-compare/players.js"');
    expect(indexHtml).toContain('data-piece="claro"');
    expect(indexHtml).toContain('data-vis="ruffle"');
    expect(indexHtml).toContain('data-vis="awayfl"');
    expect(indexHtml).toContain('type="button" class="vis is-on" data-vis="ruffle"');
    expect(claroHtml).toContain('class="vis-toggle" data-vis="ruffle"');
    expect(claroHtml).toContain('class="vis-toggle" data-vis="awayfl"');
    expect(playersSrc).toContain('el.dataset.player !== "ruffle"');
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
    };
  }
}
