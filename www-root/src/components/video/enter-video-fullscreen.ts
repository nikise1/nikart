interface WebKitFullscreenVideo extends HTMLVideoElement {
  webkitDisplayingFullscreen?: boolean;
  webkitEnterFullscreen?: () => void;
  webkitRequestFullscreen?: () => void;
}

/** Enter the standard fullscreen element, or the iPhone system player. */
export function enterVideoFullscreen(video: HTMLVideoElement, doc: Document): void {
  const webkit = video as WebKitFullscreenVideo;
  if (doc.fullscreenElement || webkit.webkitDisplayingFullscreen) return;

  if (doc.fullscreenEnabled && typeof video.requestFullscreen === "function") {
    void video.requestFullscreen().catch(() => undefined);
    return;
  }

  const enter = webkit.webkitEnterFullscreen ?? webkit.webkitRequestFullscreen;
  if (!enter) return;
  try {
    enter.call(video);
  } catch {
    // The play event is not a user gesture in every browser.
  }
}
