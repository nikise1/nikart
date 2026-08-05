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
    popWin(filename, winname, width, height, resize, scrollbars, location) {
      const left = screen.availWidth / 2 - width / 2;
      const top = screen.availHeight / 2 - height / 2;
      const specs = [
        "toolbar=no",
        "directories=no",
        "status=no",
        "menubar=no",
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        `resizable=${resize}`,
        `scrollbars=${scrollbars}`,
        `location=${location}`,
      ].join(",");
      const popup = window.open(filename, winname, specs);
      popup?.focus();
      nikart.doTracker(`${winname}_launch`);
    },
    doTracker(event) {
      console.log(`nikart.doTracker: fl_${event}`);
    },
  };

  window.nikart = nikart;
}
