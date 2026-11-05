"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { ViewTransition } from "react";
import { videoH264Url, videoWebmUrl } from "@/lib/assets";
import { localize } from "@/lib/data/content";
import type { ContentItem, Locale } from "@/lib/data/schema";
import { ContentDescription } from "@/components/content-description/content-description";
import { ContentTitle } from "@/components/content-title/content-title";
import { ContentTransition } from "@/components/content-transition/content-transition";
import { enterVideoFullscreen } from "./enter-video-fullscreen";
import { fitVideoFrame, type VideoFrame } from "./fit-video-frame";
import { leaveVideoFullscreen } from "./leave-video-fullscreen";

interface VideoViewProps {
  item: ContentItem;
  locale: Locale;
  /** Optional `{id}_poster.jpg`. Its pixel size places the player before the video file is known. */
  poster?: string | null;
}

interface SourceFrame extends VideoFrame {
  readonly id: string;
}

function readFrame(video: HTMLVideoElement, id: string): SourceFrame | null {
  if (video.videoWidth < 1 || video.videoHeight < 1) return null;
  return { id, width: video.videoWidth, height: video.videoHeight };
}

export function VideoView({ item, locale, poster = null }: VideoViewProps) {
  const title = localize(item.title, locale);
  const desc = localize(item.desc, locale);
  const stageRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // A deliberate fullscreen exit stays inline until this video is left.
  const declinedFullscreenRef = useRef(false);
  const [source, setSource] = useState<SourceFrame | null>(null);
  const [posterFrame, setPosterFrame] = useState<SourceFrame | null>(null);
  const [space, setSpace] = useState<VideoFrame | null>(null);

  const videoFrame = source?.id === item.id ? source : null;
  const knownPoster = poster && posterFrame?.id === item.id ? posterFrame : null;
  const frame = videoFrame ?? knownPoster;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = (): void => {
      const stageBox = stage.getBoundingClientRect();
      const captionBox = captionRef.current?.getBoundingClientRect();
      const captionHeight = captionBox ? Math.ceil(captionBox.height) : 0;
      const width = Math.floor(stageBox.width);
      const height = Math.floor(stageBox.height - captionHeight);
      setSpace((current) => {
        if (current?.width === width && current.height === height) return current;
        return { width, height };
      });
    };

    measure();
    const video = videoRef.current;
    const known = video ? readFrame(video, item.id) : null;
    if (known) setSource(known);
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    if (captionRef.current) observer.observe(captionRef.current);
    return () => observer.disconnect();
  }, [item.id, desc]);

  useEffect(() => {
    declinedFullscreenRef.current = false;
    const video = videoRef.current;
    if (!video) return;

    let showing = false;
    const sync = (): void => {
      const webkit = video as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean };
      const active =
        document.fullscreenElement === video || Boolean(webkit.webkitDisplayingFullscreen);
      if (showing && !active && !video.ended) declinedFullscreenRef.current = true;
      showing = active;
    };

    document.addEventListener("fullscreenchange", sync);
    video.addEventListener("webkitbeginfullscreen", sync);
    video.addEventListener("webkitendfullscreen", sync);
    return () => {
      declinedFullscreenRef.current = false;
      document.removeEventListener("fullscreenchange", sync);
      video.removeEventListener("webkitbeginfullscreen", sync);
      video.removeEventListener("webkitendfullscreen", sync);
    };
  }, [item.id]);

  useEffect(() => {
    if (!poster) return;

    const image = new Image();
    const id = item.id;
    image.onload = () => {
      if (image.naturalWidth < 1 || image.naturalHeight < 1) return;
      setPosterFrame({ id, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.src = poster;
    return () => {
      image.onload = null;
    };
  }, [item.id, poster]);

  let slot = 0;
  const titleSlot = slot++;
  const playerSlot = slot++;
  const descSlot = desc ? slot++ : null;

  const fitted = frame && space ? fitVideoFrame(frame, space) : null;
  const ready = fitted !== null && fitted.width > 0 && fitted.height > 0;

  function onLoadedMetadata(event: SyntheticEvent<HTMLVideoElement>): void {
    const known = readFrame(event.currentTarget, item.id);
    if (known) setSource(known);
  }

  function onPlay(event: SyntheticEvent<HTMLVideoElement>): void {
    if (declinedFullscreenRef.current) return;
    enterVideoFullscreen(event.currentTarget, document);
  }

  function onEnded(event: SyntheticEvent<HTMLVideoElement>): void {
    leaveVideoFullscreen(event.currentTarget, document);
  }

  return (
    <ViewTransition enter="none" exit="none" update="none" share="none" default="none">
      <article
        data-component="VideoView"
        className="flex h-dvh min-h-0 w-full flex-col items-center gap-4 p-4"
      >
        <ContentTransition index={titleSlot}>
          <ContentTitle text={title} />
        </ContentTransition>

        <div
          ref={stageRef}
          data-component="VideoStage"
          className="flex min-h-0 w-full flex-1 items-center justify-center"
        >
          <div className="flex w-full flex-col items-center">
            <ContentTransition index={playerSlot}>
              {/* Without a poster, the icon is 4:3 and must not size the player. */}
              <video
                key={item.id}
                ref={videoRef}
                controls
                poster={poster ?? undefined}
                width={frame?.width}
                height={frame?.height}
                preload="metadata"
                onLoadedMetadata={onLoadedMetadata}
                onPlay={onPlay}
                onEnded={onEnded}
                className={
                  ready
                    ? "rounded bg-black object-contain"
                    : "pointer-events-none absolute h-px w-px opacity-0"
                }
                style={
                  ready && fitted
                    ? { width: `${fitted.width}px`, height: `${fitted.height}px` }
                    : undefined
                }
              >
                <source src={videoH264Url(item.id)} type="video/mp4" />
                <source src={videoWebmUrl(item.id)} type="video/webm" />
              </video>
            </ContentTransition>

            {descSlot !== null && desc && (
              <div ref={captionRef} data-component="VideoCaption" className="flow-root w-full">
                <ContentTransition index={descSlot}>
                  <ContentDescription text={desc} />
                </ContentTransition>
              </div>
            )}
          </div>
        </div>
      </article>
    </ViewTransition>
  );
}
