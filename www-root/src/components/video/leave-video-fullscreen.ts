interface WebKitFullscreenVideo extends HTMLVideoElement {
  webkitDisplayingFullscreen?: boolean;
  webkitExitFullscreen?: () => void;
}

/** Leave the standard fullscreen element, or the iPhone system player. */
export function leaveVideoFullscreen(video: HTMLVideoElement, doc: Document): void {
  if (doc.fullscreenElement) {
    void doc.exitFullscreen()?.catch(() => undefined);
    return;
  }

  const webkit = video as WebKitFullscreenVideo;
  if (webkit.webkitDisplayingFullscreen) {
    webkit.webkitExitFullscreen?.();
  }
}
