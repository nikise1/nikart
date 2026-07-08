"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface NavCanvasProps {
  open: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  numItems: number;
}

const CANVAS_WIDTH = 130;
const CANVAS_HEIGHT = 280;

// Timing must match nav-items.tsx
const TIME_NAV_OUT = 0.5;
const TIME_NAV_STAGGER_OUT = 0.075;

export function NavCanvas({ open, containerRef, numItems }: NavCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (open) {
        drawBezierShape(canvas);
        gsap.fromTo(
          canvas,
          { x: -120, y: -CANVAS_HEIGHT },
          { x: 0, y: 0, duration: 0.5, ease: "power2.out" },
        );
      } else {
        // Delay canvas close until items finish animating out (matches legacy doneAniOut)
        const closeDelay = TIME_NAV_OUT + (numItems - 1) * TIME_NAV_STAGGER_OUT;
        gsap.to(canvas, {
          x: -120,
          y: -CANVAS_HEIGHT,
          duration: 0.5,
          delay: closeDelay,
          ease: "power2.in",
          onComplete: () => {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          },
        });
      }
    },
    { scope: containerRef, dependencies: [open] },
  );

  return (
    <canvas
      ref={canvasRef}
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
