import { resolveFlashLaunchHref } from "@/lib/assets";
import { buildAwayFlPopupUrl, isAwayFlLaunch } from "@/lib/awayfl-static";
import { compareHrefForSource } from "@/lib/swf-compare";
import { openWebTab } from "@/lib/web-tab";

declare global {
  interface Window {
    nikart?: FlashBridge;
  }
}

export interface FlashBridge {
  popWin: (
    filename: string,
    winname: string,
    width: number,
    height: number,
    resize: string,
    scrollbars: string,
    location: string,
  ) => void;
  doTracker: (event: string) => void;
}

export function installFlashBridge(): void {
  const nikart: FlashBridge = window.nikart ?? {
    // Flash still passes resize, scrollbars, and location. A features string
    // would open a popup, which browsers block, so those args are ignored.
    popWin(filename, winname, width, height) {
      const launchHref = resolveFlashLaunchHref(filename);
      const compareHref = compareHrefForSource(launchHref);
      const href =
        compareHref ??
        (isAwayFlLaunch(launchHref)
          ? buildAwayFlPopupUrl(launchHref, {
              width,
              height,
              title: winname,
            })
          : launchHref);
      openWebTab(href);
      nikart.doTracker(`${winname}_launch`);
    },
    doTracker(event) {
      console.log(`nikart.doTracker: fl_${event}`);
    },
  };

  window.nikart = nikart;
}
