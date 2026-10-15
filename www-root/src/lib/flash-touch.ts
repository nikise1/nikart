/**
 * The lizard movie is AVM1. Ruffle only sends rollOver while the mouse
 * button is up; a finger tap arrives as pointerdown with no prior move, so
 * the contact is a drag and onRollOver never runs. Prime a hover at the
 * touch point before that press reaches the canvas.
 */
export function installFlashTouchHover(player: HTMLElement): () => void {
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") {
      return;
    }
    const canvas = player.shadowRoot?.querySelector("canvas");
    if (!canvas) {
      return;
    }
    primeTouchHover(canvas, event);
  };

  player.addEventListener("pointerdown", onPointerDown, { capture: true });
  return () => {
    player.removeEventListener("pointerdown", onPointerDown, { capture: true });
  };
}

export function primeTouchHover(canvas: Element, event: PointerEvent): void {
  const rect = canvas.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;
  const hover = new PointerEvent("pointermove", {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    clientX: event.clientX,
    clientY: event.clientY,
    screenX: event.screenX,
    screenY: event.screenY,
    button: -1,
    buttons: 0,
    isPrimary: event.isPrimary,
  });
  // Synthetic events report offsetX/offsetY as 0. Ruffle maps those.
  Object.defineProperty(hover, "offsetX", { configurable: true, get: () => offsetX });
  Object.defineProperty(hover, "offsetY", { configurable: true, get: () => offsetY });
  canvas.dispatchEvent(hover);
}
