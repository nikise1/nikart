interface AwayFlPlayerGlobal {
  AVMPlayer: new (gameConfig: {
    files: unknown[];
    x?: number | string;
    y?: number | string;
    w?: number | string;
    h?: number | string;
    stageScaleMode?: string;
  }) => AwayFlPlayerInstance;
  PlayerGlobal: { builtinsBaseUrl: string };
  StageManager: { htmlCanvas: HTMLCanvasElement | null };
}

interface AwayFlPlayerInstance {
  playSWF(buffer: ArrayBuffer, url: string): void;
  play(offset?: number): void;
  dispose(): void;
  addEventListener(type: string, listener: (event: unknown) => void): void;
  setStageDimensions?(x: number, y: number, w: number, h: number): void;
}

declare global {
  interface Window {
    awayflplayer?: AwayFlPlayerGlobal;
  }
}

export {};
