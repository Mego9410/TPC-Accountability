"use client";

import { useEffect, useRef } from "react";

/**
 * An engine-turned rosette, drawn on canvas — the ornament engraved on a share
 * certificate or a club invitation. Many hypotrochoids, each rotated a little
 * from the last, in gold at very low opacity, faded out radially so it sinks
 * into the ground at the edges rather than stopping at a hard circle.
 *
 * Decorative only: aria-hidden, and it draws once. With reduced motion it
 * appears fully drawn instead of sweeping on.
 */
export function Engraving({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.46;

      // Three nested rosettes, each a different gear ratio, so the pattern
      // reads as engraved rather than plotted.
      const rings = [
        { R: 1, r: 0.2166, d: 0.72, turns: 34, scale: 1, alpha: 0.2 },
        { R: 1, r: 0.1428, d: 0.55, turns: 26, scale: 0.72, alpha: 0.16 },
        { R: 1, r: 0.3125, d: 0.86, turns: 22, scale: 0.44, alpha: 0.12 },
      ];

      ctx.lineWidth = 0.6;
      ctx.lineJoin = "round";

      for (const ring of rings) {
        const rad = radius * ring.scale;
        for (let pass = 0; pass < ring.turns; pass += 1) {
          const phase = (pass / ring.turns) * Math.PI * 2;
          ctx.beginPath();
          const steps = 260;
          for (let i = 0; i <= steps; i += 1) {
            const t = (i / steps) * Math.PI * 2;
            const k = (ring.R - ring.r) / ring.r;
            const x = (ring.R - ring.r) * Math.cos(t) + ring.r * ring.d * Math.cos(k * t + phase);
            const y = (ring.R - ring.r) * Math.sin(t) - ring.r * ring.d * Math.sin(k * t + phase);
            const px = cx + x * rad;
            const py = cy + y * rad;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = `rgba(197, 183, 147, ${ring.alpha})`;
          ctx.stroke();
        }
      }

      // Two true circles, the way a certificate border is ruled.
      for (const factor of [1.02, 0.995]) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * factor, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(197, 183, 147, 0.2)";
        ctx.stroke();
      }

      // Fade the whole thing out towards the edges.
      const fade = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.08);
      fade.addColorStop(0, "rgba(0,0,0,0)");
      fade.addColorStop(0.62, "rgba(0,0,0,0)");
      fade.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    };

    draw();
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
