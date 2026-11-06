import {
  CONTENT_ENTER_LEAD_MS,
  CONTENT_STAGGER_MS,
  CONTENT_TRANSITION_MS,
  CONTENT_TRANSITION_SLOTS,
} from "@/components/content-transition/content-transition";

/** After the entrance animation, in case that transition aborted the first fetch. */
export const VIDEO_LOAD_RETRY_MS =
  CONTENT_TRANSITION_MS +
  CONTENT_ENTER_LEAD_MS +
  CONTENT_STAGGER_MS * (CONTENT_TRANSITION_SLOTS - 1);

/**
 * Safari does not start a client-rendered video until `load()` runs.
 * A refresh parses the sources with the document, which is why that works.
 */
export function videoNeedsLoad(video: HTMLMediaElement): boolean {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return false;
  return (
    video.networkState === HTMLMediaElement.NETWORK_EMPTY ||
    video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE ||
    video.error !== null
  );
}
