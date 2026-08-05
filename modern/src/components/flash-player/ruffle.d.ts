interface RufflePlayerElement extends HTMLElement {
  load(options: {
    url: string;
    base?: string;
    parameters?: Record<string, string>;
    backgroundColor?: string;
    allowScriptAccess?: boolean;
    allowNetworking?: "all" | "internal" | "none";
    playerVersion?: number;
    publicPath?: string;
    compatibilityRules?: boolean;
    warnOnUnsupportedContent?: boolean;
    logLevel?: "error" | "warn" | "info" | "debug" | "trace";
  }): void;
}

interface RufflePlayerInstance {
  createPlayer(): RufflePlayerElement;
}

interface RufflePlayerGlobal {
  newest(): RufflePlayerInstance;
}

declare global {
  interface Window {
    RufflePlayer?: RufflePlayerGlobal;
  }
}

export {};
