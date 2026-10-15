/**
 * Host-side AwayFL LoadVars onData patch (does not edit the AwayFL UMD).
 *
 * Flash Player lets a movie replace LoadVars.onData so it can parse a raw body
 * (the lizard site does that, then classes.JSON.parse). AwayFL’s
 * alDefineObjectProperties treats a missing `writable: true` as READ_ONLY, so
 * `jsonFetcher.onData = fn` is dropped and defaultOnData URL-decodes JSON.
 *
 * This file:
 * 1. Lets AVM1 assign onData / onLoad / onHTTPStatus on the instance.
 * 2. Clears READ_ONLY on those prototype slots if we find LoadVars.
 * 3. Logs if defaultOnData still runs on a JSON body (override never stuck).
 *
 * Upstream fix: https://github.com/awayfl/avm1/blob/dev/lib/lib/AVM1LoadVars.ts
 * (`onData: { value: this.defaultOnData, writable: true }`).
 */
(() => {
  const READ_ONLY = 4;
  const HANDLERS = new Set(["ondata", "onload", "onhttpstatus"]);
  const state = {
    installed: false,
    canPutWrapped: false,
    unlocked: false,
    defaultWrapped: false,
  };

  function log(...args) {
    console.log("[nikart] AwayFL LoadVars patch:", ...args);
  }

  function warn(...args) {
    console.warn("[nikart] AwayFL LoadVars patch:", ...args);
  }

  function handlerName(name) {
    return HANDLERS.has(String(name ?? "").toLowerCase());
  }

  function coerceText(src) {
    if (typeof src === "string") {
      return src;
    }
    if (src == null) {
      return "";
    }
    if (typeof src === "object" && typeof src.toString === "function") {
      try {
        return String(src);
      } catch {
        return "";
      }
    }
    return String(src);
  }

  function looksLikeJson(text) {
    const trimmed = text.trim();
    return trimmed.startsWith("{") || trimmed.startsWith("[");
  }

  function wrapAlCanPut(sample) {
    let proto = sample;
    while (proto && !Object.prototype.hasOwnProperty.call(proto, "alCanPut")) {
      proto = Object.getPrototypeOf(proto);
      if (!proto || proto === Object.prototype) {
        return false;
      }
    }
    if (!proto || proto.__nikartLoadVarsCanPut) {
      return Boolean(proto?.__nikartLoadVarsCanPut);
    }
    const original = proto.alCanPut;
    if (typeof original !== "function") {
      return false;
    }
    proto.__nikartLoadVarsCanPut = true;
    proto.alCanPut = function alCanPutLoadVarsHandlers(name) {
      if (handlerName(name)) {
        return true;
      }
      return original.call(this, name);
    };
    state.canPutWrapped = true;
    log("alCanPut allows onData/onLoad/onHTTPStatus overrides");
    return true;
  }

  function unlockPrototypeHandlers(proto) {
    if (!proto || typeof proto.alGetOwnProperty !== "function") {
      return false;
    }
    let changed = false;
    for (const name of ["onData", "onLoad", "onHTTPStatus"]) {
      const desc = proto.alGetOwnProperty(name);
      if (desc && typeof desc.flags === "number" && desc.flags & READ_ONLY) {
        desc.flags &= ~READ_ONLY;
        changed = true;
      }
    }
    if (changed) {
      state.unlocked = true;
      log("cleared READ_ONLY on LoadVars event handlers");
    }
    return changed;
  }

  function wrapDefaultOnData(holder) {
    const target =
      holder && typeof holder.defaultOnData === "function"
        ? holder
        : Object.getPrototypeOf(holder ?? {});
    if (!target || typeof target.defaultOnData !== "function") {
      return false;
    }
    if (target.__nikartDefaultOnData) {
      return true;
    }
    const original = target.defaultOnData;
    target.__nikartDefaultOnData = true;
    target.defaultOnData = function patchedDefaultOnData(src) {
      const text = coerceText(src);
      const json = looksLikeJson(text);
      if (json) {
        warn(
          "defaultOnData saw JSON; instance onData should have run instead",
          { bytes: text.length },
        );
        const own = this._ownProperties ?? {};
        for (const key of Object.keys(own)) {
          if (key.toLowerCase() !== "ondata") {
            continue;
          }
          const fn = own[key]?.value;
          if (fn && typeof fn.alCall === "function") {
            log("forwarding JSON body to own onData");
            return fn.alCall(this, [text]);
          }
        }
      }
      return original.call(this, src);
    };
    state.defaultWrapped = true;
    log("wrapped defaultOnData");
    return true;
  }

  function tryProp(obj, key) {
    try {
      return obj[key];
    } catch {
      return undefined;
    }
  }

  function visit(root) {
    const seen = new Set();
    const stack = [root];
    while (stack.length) {
      const cur = stack.pop();
      if (!cur || (typeof cur !== "object" && typeof cur !== "function")) {
        continue;
      }
      if (seen.has(cur)) {
        continue;
      }
      seen.add(cur);
      if (seen.size > 1200) {
        break;
      }

      try {
        if (typeof cur.alCanPut === "function" && typeof cur.alPut === "function") {
          wrapAlCanPut(cur);
        }
      } catch {
        // Half-init AVM1 objects can throw from getters.
      }
      try {
        if (typeof cur.alGetPrototypeProperty === "function") {
          const proto = cur.alGetPrototypeProperty();
          unlockPrototypeHandlers(proto);
          wrapDefaultOnData(proto);
        }
      } catch {
        // AVM1 getters can throw on half-init objects.
      }
      try {
        wrapDefaultOnData(cur);
      } catch {
        // Ignore non-AVM1 prototypes.
      }

      for (const key of [
        "LoadVars",
        "globals",
        "_avmHandler",
        "_factory",
        "factory",
        "avm1Context",
        "context",
      ]) {
        const next = tryProp(cur, key);
        if (next) {
          stack.push(next);
        }
      }
    }
  }

  function attachPlayer(player) {
    if (!player || player.__nikartLoadVarsHooked) {
      return;
    }
    player.__nikartLoadVarsHooked = true;
    const run = (why) => {
      visit(player);
      if (state.canPutWrapped || state.unlocked) {
        log("applied on", why, {
          canPutWrapped: state.canPutWrapped,
          unlocked: state.unlocked,
          defaultWrapped: state.defaultWrapped,
        });
      }
    };
    if (typeof player.addEventListener === "function") {
      player.addEventListener("avmComplete", () => run("avmComplete"));
      player.addEventListener("loaderComplete", () => run("loaderComplete"));
    }
  }

  function wrapPlayerCtor(Orig) {
    if (!Orig || Orig.__nikartLoadVarsWrapped) {
      return Orig;
    }
    const Wrapped = new Proxy(Orig, {
      construct(target, args, newTarget) {
        const player = Reflect.construct(target, args, newTarget);
        attachPlayer(player);
        return player;
      },
    });
    Wrapped.__nikartLoadVarsWrapped = true;
    return Wrapped;
  }

  function install() {
    const away = window.awayflplayer;
    if (!away?.AVMPlayer) {
      return false;
    }
    away.AVMPlayer = wrapPlayerCtor(away.AVMPlayer);
    state.installed = true;
    log("installed on AVMPlayer");
    return true;
  }

  function boot() {
    if (install()) {
      return;
    }
    window.setTimeout(boot, 30);
  }

  window.NikartAwayFlLoadVarsPatch = {
    install,
    getState: () => ({ ...state }),
  };

  boot();
})();
