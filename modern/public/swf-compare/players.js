(() => {
  const RUFFLE_SRC = "/ruffle/ruffle.js";
  const AWAYFL_SRC = "/awayfl/awayfl-player.umd.js";
  const BUILTINS = "/awayfl/builtins";
  const movieBuffers = new Map();

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        if (src.includes("ruffle") && window.RufflePlayer) {
          resolve();
          return;
        }
        if (src.includes("awayfl") && window.awayflplayer) {
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

  function applyStageBox(el) {
    const native = nativeSize(el);
    el.style.setProperty("--swf-aspect", `${native.width} / ${native.height}`);
  }

  function paneBox(el) {
    const native = nativeSize(el);
    const width = Math.max(1, Math.round(el.clientWidth || native.width));
    const height = Math.max(
      1,
      Math.round(el.clientHeight || (width * native.height) / native.width),
    );
    return { width, height };
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
    return id ? `/swf-compare/pieces/${id}/index.html` : null;
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
    player.style.width = "100%";
    player.style.height = "100%";
    el.replaceChildren(player);
    await player.load({
      ...ruffleLoadOptions(el, url),
      data: new Uint8Array(buffer.slice(0)),
      swfFileName: url.pathname.split("/").pop() ?? "movie.swf",
    });
    setStatus(el, "");
  }

  async function startAwayFl(el) {
    applyStageBox(el);
    setStatus(el, "Loading AwayFL…");
    await loadScript(AWAYFL_SRC);
    const started = Date.now();
    while (!window.awayflplayer && Date.now() - started < 20000) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!window.awayflplayer) {
      throw new Error("AwayFL player failed to load.");
    }
    const buffer = await movieBuffer(el);
    const canvas = document.createElement("canvas");
    canvas.id = `awayfl_stage_${el.dataset.swf?.replace(/\W+/g, "_") ?? "swf"}`;
    canvas.style.display = "block";
    el.replaceChildren(canvas);
    const size = paneBox(el);
    window.awayflplayer.StageManager.htmlCanvas = canvas;
    window.awayflplayer.PlayerGlobal.builtinsBaseUrl = BUILTINS;
    const player = new window.awayflplayer.AVMPlayer({
      files: [],
      x: 0,
      y: 0,
      w: size.width,
      h: size.height,
      stageScaleMode: "showAll",
    });
    let lastBox = `${size.width}x${size.height}`;
    const refit = () => {
      const next = paneBox(el);
      const key = `${next.width}x${next.height}`;
      if (key === lastBox) {
        return;
      }
      lastBox = key;
      player.setStageDimensions?.(0, 0, next.width, next.height);
    };
    window.addEventListener("resize", refit);
    if (typeof ResizeObserver === "function") {
      new ResizeObserver(refit).observe(el);
    }
    player.addEventListener("loaderComplete", () => {
      refit();
      setStatus(el, "");
    });
    player.playSWF(buffer, playHref(el).href);
    setStatus(el, "Starting AwayFL…");
  }

  const starters = {
    ruffle: startRuffle,
    awayfl: startAwayFl,
  };

  window.SwfCompare = { startRuffle, startAwayFl };
  installFlashBridge();

  async function runStarter(el) {
    const kind = el.dataset.player;
    const start = starters[kind];
    if (!start) {
      return;
    }
    try {
      await start(el);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(el, message, true);
    }
  }

  async function boot() {
    const stages = [...document.querySelectorAll("[data-player]")];
    stages.forEach(applyStageBox);
    const ruffle = stages.filter((el) => el.dataset.player === "ruffle");
    const rest = stages.filter((el) => el.dataset.player !== "ruffle");
    for (const el of ruffle) {
      await runStarter(el);
    }
    for (const el of rest) {
      await runStarter(el);
    }
  }

  boot();
})();
