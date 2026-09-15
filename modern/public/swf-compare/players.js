(() => {
  const RUFFLE_SRC = "/ruffle/ruffle.js";
  const AWAYFL_SRC = "/awayfl/awayfl-player.umd.js";
  const BUILTINS = "/awayfl/builtins";

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

  function stageSize(el) {
    const width = Number.parseInt(el.dataset.width ?? "", 10);
    const height = Number.parseInt(el.dataset.height ?? "", 10);
    return {
      width: Number.isFinite(width) ? width : el.clientWidth || 640,
      height: Number.isFinite(height) ? height : el.clientHeight || 400,
    };
  }

  function swfHref(el) {
    return new URL(el.dataset.swf ?? "", window.location.href);
  }

  async function startRuffle(el) {
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
    const size = stageSize(el);
    const ruffle = window.RufflePlayer.newest();
    const player = ruffle.createPlayer();
    player.style.width = `${size.width}px`;
    player.style.height = `${size.height}px`;
    player.style.maxWidth = "100%";
    el.replaceChildren(player);
    await player.load({
      url: url.href,
      base: url.href.replace(/[^/]+$/, ""),
      publicPath: "/ruffle/",
      allowScriptAccess: true,
      allowNetworking: "all",
      compatibilityRules: true,
      warnOnUnsupportedContent: true,
      logLevel: "warn",
    });
    setStatus(el, "");
  }

  async function startAwayFl(el) {
    setStatus(el, "Loading AwayFL…");
    await loadScript(AWAYFL_SRC);
    const started = Date.now();
    while (!window.awayflplayer && Date.now() - started < 20000) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!window.awayflplayer) {
      throw new Error("AwayFL player failed to load.");
    }
    const url = swfHref(el);
    const size = stageSize(el);
    const response = await fetch(url.href);
    if (!response.ok) {
      throw new Error(`SWF request failed (${response.status})`);
    }
    const buffer = await response.arrayBuffer();
    const canvas = document.createElement("canvas");
    canvas.id = `awayfl_stage_${el.dataset.swf?.replace(/\W+/g, "_") ?? "swf"}`;
    el.replaceChildren(canvas);
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
    player.addEventListener("loaderComplete", () => setStatus(el, ""));
    player.playSWF(buffer, url.href);
    setStatus(el, "Starting AwayFL…");
  }

  const starters = {
    ruffle: startRuffle,
    awayfl: startAwayFl,
  };

  window.SwfCompare = { startRuffle, startAwayFl };

  document.querySelectorAll("[data-player]").forEach((el) => {
    const kind = el.dataset.player;
    const start = starters[kind];
    if (!start) {
      return;
    }
    start(el).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(el, message, true);
    });
  });
})();
