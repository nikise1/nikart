"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AwayFlPlayer } from "@/components/awayfl-player/awayfl-player";
import "./away.css";

const DEFAULT_SRC = "websites/claro/index.html";

export default function AwayFlPage() {
  return (
    <Suspense fallback={<p className="fl-fallback">Loading AwayFL…</p>}>
      <AwayFlPageInner />
    </Suspense>
  );
}

function AwayFlPageInner() {
  const searchParams = useSearchParams();
  const source = searchParams.get("src") ?? DEFAULT_SRC;
  const width = optionalInt(searchParams.get("w"));
  const height = optionalInt(searchParams.get("h"));
  const title = searchParams.get("title") ?? "AwayFL preview";

  return (
    <div className="awayfl-page">
      <p className="awayfl-label">{title}</p>
      <AwayFlPlayer source={source} width={width} height={height} />
    </div>
  );
}

function optionalInt(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
