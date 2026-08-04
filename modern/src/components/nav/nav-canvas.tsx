import { NAV_POS } from "@/lib/nav-animations";

export function NavCanvas() {
  return (
    <canvas
      data-component="NavCanvas"
      width={NAV_POS.canvasWidth}
      height={NAV_POS.canvasHeight}
      className="pointer-events-none absolute"
      style={{ left: NAV_POS.canvasOutX, top: NAV_POS.canvasOutY }}
    />
  );
}
