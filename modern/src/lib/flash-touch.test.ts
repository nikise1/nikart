import { afterEach, describe, expect, it } from "vitest";
import { installFlashTouchHover } from "./flash-touch";

function stage(): { player: HTMLElement; canvas: HTMLCanvasElement } {
  const player = document.createElement("div");
  const shadow = player.attachShadow({ mode: "open" });
  const canvas = document.createElement("canvas");
  shadow.appendChild(canvas);
  document.body.appendChild(player);
  canvas.getBoundingClientRect = () =>
    ({
      x: 10,
      y: 20,
      left: 10,
      top: 20,
      right: 110,
      bottom: 70,
      width: 100,
      height: 50,
      toJSON() {
        return {};
      },
    }) as DOMRect;
  return { player, canvas };
}

describe("installFlashTouchHover", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("hovers the canvas at the touch point before the press", () => {
    const { player, canvas } = stage();
    const moves: PointerEvent[] = [];
    canvas.addEventListener("pointermove", (event) => {
      moves.push(event);
    });
    installFlashTouchHover(player);

    player.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerType: "touch",
        pointerId: 3,
        clientX: 40,
        clientY: 55,
        button: 0,
        buttons: 1,
        isPrimary: true,
      }),
    );

    expect(moves).toHaveLength(1);
    const hover = moves[0];
    expect(hover).toBeDefined();
    if (!hover) return;
    expect(hover.type).toBe("pointermove");
    expect(hover.pointerType).toBe("touch");
    expect(hover.buttons).toBe(0);
    expect(hover.offsetX).toBe(30);
    expect(hover.offsetY).toBe(35);
  });

  it("leaves mouse clicks unchanged", () => {
    const { player, canvas } = stage();
    const moves: PointerEvent[] = [];
    canvas.addEventListener("pointermove", (event) => {
      moves.push(event);
    });
    installFlashTouchHover(player);

    player.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerType: "mouse",
        clientX: 40,
        clientY: 55,
        button: 0,
        buttons: 1,
      }),
    );

    expect(moves).toHaveLength(0);
  });

  it("does nothing until the canvas exists", () => {
    const player = document.createElement("div");
    player.attachShadow({ mode: "open" });
    document.body.appendChild(player);
    installFlashTouchHover(player);

    expect(() => {
      player.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "touch",
          clientX: 1,
          clientY: 1,
        }),
      );
    }).not.toThrow();
  });

  it("stops priming after cleanup", () => {
    const { player, canvas } = stage();
    const moves: PointerEvent[] = [];
    canvas.addEventListener("pointermove", (event) => {
      moves.push(event);
    });
    const remove = installFlashTouchHover(player);
    remove();

    player.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerType: "pen",
        clientX: 40,
        clientY: 55,
      }),
    );

    expect(moves).toHaveLength(0);
  });
});
