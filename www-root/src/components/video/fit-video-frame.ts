export interface VideoFrame {
  readonly width: number;
  readonly height: number;
}

/** Largest size that matches `frame` and fits inside `space`, never larger than the source. */
export function fitVideoFrame(frame: VideoFrame, space: VideoFrame): VideoFrame {
  if (frame.width < 1 || frame.height < 1 || space.width < 1 || space.height < 1) {
    return { width: 0, height: 0 };
  }

  const scale = Math.min(1, space.width / frame.width, space.height / frame.height);
  return {
    width: Math.max(1, Math.round(frame.width * scale)),
    height: Math.max(1, Math.round(frame.height * scale)),
  };
}
