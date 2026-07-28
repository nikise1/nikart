"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { NAV_TIMING } from "@/lib/nav-timing";
import type { NavPhase } from "@/store/nav-store";

interface NavCanvasProps {
  phase: NavPhase;
  containerRef: React.RefObject<HTMLDivElement | null>;
  numItems: number;
}

const CANVAS_WIDTH = 130;
const CANVAS_HEIGHT = 280;
const CANVAS_OUT_X = -120;
const CANVAS_OUT_Y = -CANVAS_HEIGHT;

export function NavCanvas({ phase, containerRef, numItems }: NavCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (phase === "opening") {
        drawBezierShape(canvas);
        gsap.fromTo(
          canvas,
          { x: CANVAS_OUT_X, y: CANVAS_OUT_Y },
          { x: 0, y: 0, duration: NAV_TIMING.growIn, ease: "power2.out" },
        );
      } else if (phase === "closing-canvas") {
        gsap.to(canvas, {
          x: CANVAS_OUT_X,
          y: CANVAS_OUT_Y,
          duration: NAV_TIMING.growOut,
          ease: "power2.in",
          onComplete: () => {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          },
        });
      } else if (phase === "closed") {
        gsap.set(canvas, { x: CANVAS_OUT_X, y: CANVAS_OUT_Y });
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    },
    { scope: containerRef, dependencies: [phase, numItems] },
  );

  return (
    <canvas
      ref={canvasRef}
      data-component="NavCanvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="pointer-events-none absolute"
    />
  );
}

function drawBezierShape(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const dBX = 110;
  const dBY = 258;
  const thickT = 20;
  const thickB = 7;
  const halfB = thickB / 2;

  ctx.beginPath();
  ctx.moveTo(thickT, 0);
  ctx.bezierCurveTo(70, 83, 92, 167, dBX + halfB, dBY - halfB);
  ctx.quadraticCurveTo(dBX, dBY + halfB, dBX - halfB, dBY - halfB);
  ctx.bezierCurveTo(82, 167, 60, 83, 0, 0);
  ctx.closePath();

  ctx.fillStyle = "#4F3E2D";
  ctx.strokeStyle = "#4F3E2D";
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fill();
  ctx.stroke();
}
