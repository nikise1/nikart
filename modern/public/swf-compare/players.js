(() => {
  const RUFFLE_SRC = "/ruffle/ruffle.js";
  const AWAYFL_SRC = "/awayfl/awayfl-player.umd.js";
  const AWAYFL_LOADVARS_PATCH_SRC = "/awayfl/loadvars-ondata-patch.js";
  const BUILTINS = "/awayfl/builtins";
  const movieBuffers = new Map();
  const STORAGE_KEY = "swf-compare-pages";
  const DEFAULTS_SRC = "/swf-compare/visibility-defaults.json";
  const started = new WeakSet();
  let defaultPages = {};

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        if (src.includes("ruffle") && window.RufflePlayer) {
          resolve();
          return;
        }
        if (src.endsWith("awayfl-player.umd.js") && window.awayflplayer) {
          resolve();
          return;
        }
        if (
          src.endsWith("loadvars-ondata-patch.js") &&
          window.NikartAwayFlLoadVarsPatch
        ) {
          resolve();
          return;
        }
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function setStatus(el, message, isError) {
    let status = el.parentElement?.querySelector(".status");
    if (!status) {
      status = document.createElement("p");
      status.className = "status";
      el.insertAdjacentElement("afterend", status);
    }
    status.textContent = message;
    status.classList.toggle("error", Boolean(isError));
    if (!message) {
      status.remove();
    }
  }

  function nativeSize(el) {
    const width = Number.parseInt(el.dataset.width ?? "", 10);
    const height = Number.parseInt(el.dataset.height ?? "", 10);
    return {
      width: Number.isFinite(width) ? width : 640,
      height: Number.isFinite(height) ? height : 400,
    };
  }

  function isFill(el) {
    return el.dataset.fill === "1";
  }

  function fillViewport() {
    return {
      width: Math.max(1, document.documentElement.clientWidth),
      height: Math.max(1, document.documentElement.clientHeight),
    };
  }

  function applyStageBox(el) {
    const native = nativeSize(el);
    el.style.setProperty("--swf-w", String(native.width));
    el.style.setProperty("--swf-h", String(native.height));
    el.style.setProperty("--swf-aspect", `${native.width} / ${native.height}`);
    if (isFill(el)) {
      el.style.width = "100%";
      el.style.height = "100%";
      return;
    }
    el.style.width = `${native.width}px`;
    el.style.height = `${native.height}px`;
  }

  const LAUNCH_PAGES = {
    "websites/claro/index.html": "claro",
    "websites/118aua/energyball.html": "118aua-energyball",
    "websites/118aua/livefeed.html": "118aua-livefeed",
    "games/rockstars_divas/index.html": "rockstars-divas",
    "games/ciudad_helm/index.html": "ciudad",
    "games/avis_donde/index.html": "avis-donde",
    "games/whiplash/index.html": "whiplash",
    "games/desafio_pacifico/index.html": "desafio-pacifico",
    "games/reading_leeds/index.html": "reading-leeds",
    "games/escalera/index.html": "escalera",
    "games/slate20/index.html": "slate20",
    "games/weeds/index.html": "weeds",
    "3d/away3d/ar_heart/index.html": "ar-heart",
    "3d/away3d/flar_lizard/pub/index.html": "ar-lizard",
    "3d/papervision3d/spaceship/index.html": "spaceship",
    "banners/standardlife/index.html": "banner-standardlife",
    "banners/standardlife/index_lite.html": "banner-standardlife-lite",
    "banners/johnfrieda/index.html": "banner-johnfrieda",
    "banners/hellboy/index.html": "banner-hellboy",
    "banners/nintendo/index.html": "banner-nintendo",
    "banners/shell/index.html": "banner-shell",
    "banners/trunk/index.html": "banner-trunk__mpu_2",
  };

  function installFlashBridge() {
    if (window.nikart) {
      return;
    }
    window.nikart = {
      popWin(filename, winname) {
        const href = compareHrefForLaunch(filename) ?? filename;
        const tab = window.open(href, winname || "_blank");
        tab?.focus();
        window.nikart.doTracker(`${winname || "launch"}_launch`);
      },
      doTracker(event) {
        console.log(`nikart.doTracker: fl_${event}`);
      },
    };
  }

  function compareHrefForLaunch(filename) {
    const path = launchPath(filename);
    const id = LAUNCH_PAGES[path];
    return id ? `/swf-compare/${id}/index.html` : null;
  }

  function launchPath(filename) {
    const raw = String(filename ?? "").trim();
    try {
      const url = new URL(raw, window.location.origin);
      if (url.hostname === "static.nikart.co.uk") {
        return url.pathname.replace(/^\//, "");
      }
      return url.pathname.replace(/^\/static\//, "").replace(/^\//, "");
    } catch {
      return raw
        .replace(/^\.\.\//, "")
        .replace(/^static\//, "")
        .replace(/^\//, "");
    }
  }

  function swfHref(el) {
    return new URL(el.dataset.swf ?? "", window.location.href);
  }

  function loaderHref(el) {
    if (el.dataset.loaderUrl) {
      return new URL(el.dataset.loaderUrl, window.location.href);
    }
    return swfHref(el);
  }

  function parseParameters(el) {
    const raw = el.dataset.parameters;
    if (!raw) {
      return undefined;
    }
    try {
      const value = JSON.parse(raw);
      if (value && typeof value === "object") {
        return value;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  function movieBase(el, url) {
    if (el.dataset.base) {
      return new URL(el.dataset.base, window.location.href).href;
    }
    return url.href.replace(/[^/]+$/, "");
  }

  async function movieBuffer(el) {
    const href = swfHref(el).href;
    let pending = movieBuffers.get(href);
    if (!pending) {
      pending = (async () => {
        const response = await fetch(href);
        if (!response.ok) {
          throw new Error(`SWF request failed (${response.status})`);
        }
        return response.arrayBuffer();
      })();
      movieBuffers.set(href, pending);
    }
    return pending;
  }

  function ruffleLoadOptions(el, url) {
    const options = {
      base: movieBase(el, url),
      publicPath: "/ruffle/",
      allowScriptAccess: true,
      allowNetworking: "all",
      autoplay: "on",
      unmuteOverlay: "hidden",
      compatibilityRules: true,
      warnOnUnsupportedContent: true,
      logLevel: "warn",
    };
    const parameters = parseParameters(el);
    if (parameters) {
      options.parameters = parameters;
    }
    const version = Number.parseInt(el.dataset.playerVersion ?? "", 10);
    if (Number.isFinite(version)) {
      options.playerVersion = version;
    }
    if (el.dataset.background) {
      options.backgroundColor = el.dataset.background;
    }
    return options;
  }

  function playHref(el) {
    const url = loaderHref(el);
    const parameters = parseParameters(el);
    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }
    return url;
  }

  function rewriteContentLoaderUrl(url) {
    if (typeof url !== "string" || !url) {
      return url;
    }
    const marker = "../content/";
    const relative = url.indexOf(marker);
    if (relative !== -1) {
      return `/content/${url.slice(relative + marker.length)}`;
    }
    try {
      const resolved = new URL(url, window.location.href);
      const alias = "/swf-compare/content/";
      if (resolved.pathname.startsWith(alias)) {
        return `/content/${resolved.pathname.slice(alias.length)}${resolved.search}`;
      }
    } catch {
      return url;
    }
    return url;
  }

  function awayFlRedirects(el) {
    if (!el.dataset.base) {
      return [];
    }
    const loader = loaderHref(el);
    return [
      {
        test: (url) =>
          typeof url === "string" && url.includes("../content/"),
        resolve: (url) => {
          const marker = "../content/";
          const rel = url.slice(url.indexOf(marker));
          return new URL(rel, loader).pathname;
        },
      },
    ];
  }

  function installContentLoaderAlias() {
    const proto = XMLHttpRequest.prototype;
    if (proto.__nikartContentAlias) {
      return;
    }
    proto.__nikartContentAlias = true;
    const open = proto.open;
    proto.open = function (method, url, ...rest) {
      return open.call(this, method, rewriteContentLoaderUrl(url), ...rest);
    };
  }

  async function startRuffle(el) {
    applyStageBox(el);
    setStatus(el, "Loading Ruffle…");
    await loadScript(RUFFLE_SRC);
    const started = Date.now();
    while (!window.RufflePlayer && Date.now() - started < 15000) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!window.RufflePlayer) {
      throw new Error("Ruffle player failed to load.");
    }
    const url = swfHref(el);
    const buffer = await movieBuffer(el);
    const ruffle = window.RufflePlayer.newest();
    const player = ruffle.createPlayer();
    const native = nativeSize(el);
    if (isFill(el)) {
      player.style.width = "100%";
      player.style.height = "100%";
    } else {
      player.style.width = `${native.width}px`;
      player.style.height = `${native.height}px`;
    }
    el.replaceChildren(player);
    const options = ruffleLoadOptions(el, url);
    if (isFill(el)) {
      options.scale = "showAll";
    }
    await player.load({
      ...options,
      data: new Uint8Array(buffer.slice(0)),
      swfFileName: url.pathname.split("/").pop() ?? "movie.swf",
    });
    setStatus(el, "");
  }

  async function startAwayFl(el) {
    applyStageBox(el);
    setStatus(el, "Loading AwayFL…");
    await loadScript(AWAYFL_SRC);
    await loadScript(AWAYFL_LOADVARS_PATCH_SRC);
    const started = Date.now();
    while (!window.awayflplayer && Date.now() - started < 20000) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!window.awayflplayer) {
      throw new Error("AwayFL player failed to load.");
    }
    window.NikartAwayFlLoadVarsPatch?.install?.();
    const buffer = await movieBuffer(el);
    const canvas = document.createElement("canvas");
    canvas.id = `awayfl_stage_${el.dataset.swf?.replace(/\W+/g, "_") ?? "swf"}`;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    el.replaceChildren(canvas);
    const size = isFill(el) ? fillViewport() : nativeSize(el);
    window.awayflplayer.StageManager.htmlCanvas = canvas;
    window.awayflplayer.PlayerGlobal.builtinsBaseUrl = BUILTINS;
    const loaderUrl = playHref(el).href;
    installContentLoaderAlias();
    const player = new window.awayflplayer.AVMPlayer({
      files: [{ data: buffer, path: loaderUrl, resourceType: "GAME" }],
      redirects: awayFlRedirects(el),
      x: 0,
      y: 0,
      w: size.width,
      h: size.height,
      stageScaleMode: "showAll",
    });
    const fitAwayFl = () => {
      const next = isFill(el) ? fillViewport() : size;
      player.setStageDimensions?.(0, 0, next.width, next.height);
    };
    player.addEventListener("loaderComplete", () => {
      fitAwayFl();
      player.play?.();
      setStatus(el, "");
    });
    if (isFill(el)) {
      window.addEventListener("resize", () => {
        fitAwayFl();
      });
    }
    if (typeof player.load === "function") {
      player.load();
    } else {
      player.playSWF(buffer, loaderUrl);
    }
    setStatus(el, "Starting AwayFL…");
  }

  const starters = {
    ruffle: startRuffle,
    awayfl: startAwayFl,
  };

  function defaultPage(id) {
    const d = defaultPages[id];
    return {
      ruffle: d?.ruffle ?? true,
      awayfl: d?.awayfl ?? true,
    };
  }

  async function loadDefaults() {
    try {
      const response = await fetch(DEFAULTS_SRC);
      if (!response.ok) {
        return;
      }
      const parsed = await response.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        defaultPages = parsed;
      }
    } catch {
      defaultPages = {};
    }
  }

  function pieceIdFromPath(pathname) {
    const raw = String(pathname ?? "");
    const match = raw.match(/\/swf-compare\/([^/]+)\//);
    const id = match?.[1];
    if (!id || id === "pieces") {
      return null;
    }
    return id;
  }

  function readStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  function writeStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function pageState(id) {
    const stored = readStore()[id];
    const defaults = defaultPage(id);
    return {
      ruffle: stored?.ruffle ?? defaults.ruffle,
      awayfl: stored?.awayfl ?? defaults.awayfl,
    };
  }

  function setPageVisible(id, player, visible) {
    const store = readStore();
    store[id] = {
      ...pageState(id),
      [player]: Boolean(visible),
    };
    writeStore(store);
    return pageState(id);
  }

  function applyPane(el, visible) {
    const pane = el.closest(".pane");
    if (!pane) {
      return;
    }
    pane.classList.toggle("is-off", !visible);
    const btn = pane.querySelector(".vis-toggle");
    if (btn) {
      btn.textContent = visible ? "Hide" : "Show";
      btn.setAttribute("aria-pressed", visible ? "true" : "false");
    }
  }

  function paintIndexCards() {
    for (const card of document.querySelectorAll("[data-piece]")) {
      const state = pageState(card.getAttribute("data-piece"));
      for (const vis of card.querySelectorAll("[data-vis]")) {
        const on = state[vis.getAttribute("data-vis")] !== false;
        vis.classList.toggle("is-on", on);
        vis.classList.toggle("is-off", !on);
        vis.setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
  }

  function applyPiece(id) {
    const state = pageState(id);
    for (const el of document.querySelectorAll("[data-player]")) {
      applyPane(el, state[el.dataset.player] !== false);
    }
    paintIndexCards();
  }

  function toggleVisible(id, player) {
    if (player !== "ruffle" && player !== "awayfl") {
      return false;
    }
    const next = pageState(id)[player] === false;
    setPageVisible(id, player, next);
    applyPiece(id);
    return next;
  }

  window.SwfCompare = {
    startRuffle,
    startAwayFl,
    STORAGE_KEY,
    pieceIdFromPath,
    readStore,
    pageState,
    setPageVisible,
    paintIndexCards,
    applyPiece,
    toggleVisible,
    defaultPage,
  };
  installFlashBridge();

  async function runStarter(el) {
    const kind = el.dataset.player;
    const start = starters[kind];
    if (!start || !el.dataset.swf || started.has(el)) {
      return;
    }
    started.add(el);
    try {
      await start(el);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(el, message, true);
    }
  }

  function bindToggles(id) {
    for (const btn of document.querySelectorAll(".vis-toggle[data-vis]")) {
      if (btn.dataset.bound === "1") {
        continue;
      }
      btn.dataset.bound = "1";
      btn.addEventListener("click", async (event) => {
        event.preventDefault();
        const player = btn.getAttribute("data-vis");
        const next = toggleVisible(id, player);
        if (next) {
          const el = document.querySelector(`[data-player="${player}"]`);
          if (el) {
            await runStarter(el);
          }
        }
      });
    }
  }

  function bindIndexToggles() {
    for (const btn of document.querySelectorAll(".card-vis [data-vis]")) {
      if (btn.dataset.bound === "1") {
        continue;
      }
      btn.dataset.bound = "1";
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const card = btn.closest("[data-piece]");
        const id = card?.getAttribute("data-piece");
        if (!id) {
          return;
        }
        toggleVisible(id, btn.getAttribute("data-vis"));
      });
    }
  }

  async function bootPiece(id) {
    const state = pageState(id);
    const stages = [...document.querySelectorAll("[data-player]")];
    stages.forEach(applyStageBox);
    applyPiece(id);
    bindToggles(id);
    const ruffle = stages.filter((el) => el.dataset.player === "ruffle");
    const rest = stages.filter((el) => el.dataset.player !== "ruffle");
    for (const el of ruffle) {
      if (isFill(el) || state.ruffle !== false) {
        await runStarter(el);
      }
    }
    for (const el of rest) {
      if (isFill(el) || state[el.dataset.player] !== false) {
        await runStarter(el);
      }
    }
  }

  async function boot() {
    await loadDefaults();
    const id = pieceIdFromPath(window.location.pathname);
    paintIndexCards();
    bindIndexToggles();
    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) {
        if (id) {
          applyPiece(id);
        }
        paintIndexCards();
      }
    });
    if (id) {
      await bootPiece(id);
    }
  }

  window.SwfCompare.ready = boot();
})();
