"use client";

import { MARK, PHOTO } from "./photos";
import { Arrow, MagLink } from "./shell";

/* =========================================================================
   The door.

   A photograph of a practice at blue hour, the word struck across it, and
   the three figures of the Club ruled underneath. The pointer moves the
   image and the word by a few pixels in opposite directions, which is the
   whole of the depth: no 3D, no scroll hijack.
   ------------------------------------------------------------------------- */

const STRIP = [
  { n: "I · The partner", line: "One principal, chosen and asked by you." },
  { n: "II · The visit", line: "A morning inside each other's practices." },
  { n: "III · The rest", line: "Nothing scored, ranked or counted." },
];

export function Hero() {
  return (
    <section
      className="hero"
      aria-labelledby="hero-h"
      onMouseMove={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--px", (x - 0.5).toFixed(3));
        el.style.setProperty("--py", (y - 0.5).toFixed(3));
        el.style.setProperty("--hx", `${(x * 100).toFixed(1)}%`);
        el.style.setProperty("--hy", `${(y * 100).toFixed(1)}%`);
      }}
    >
      <div className="hero-par">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-img"
          src={PHOTO.exterior}
          alt="A Georgian townhouse practice at blue hour, its ground-floor windows lit"
        />
      </div>
      <div className="spot" aria-hidden="true" />
      <div className="hero-shade" aria-hidden="true" />
      <svg className="grain" aria-hidden="true" width="100%" height="100%">
        <filter id="gr1">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#gr1)" />
      </svg>

      <div className="curtain" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK} alt="" />
        <i />
      </div>

      <div className="lpwrap hero-body">
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)", gap: 64, alignItems: "end" }}>
          <div>
            <p className="eb hero-in" style={{ color: "#C5B793", animationDelay: "2.1s" }}>
              An accountability club for principal dentists · Est. MMXXVI
            </p>
            <h1 id="hero-h" className="lpkept kept-par" aria-label="Kept." style={{ marginTop: 28 }}>
              {["K", "e", "p", "t", "."].map((ch, i) => (
                <span key={i} aria-hidden="true" style={{ animationDelay: `${2.15 + i * 0.08}s` }}>{ch}</span>
              ))}
            </h1>
          </div>

          <div className="hero-in" style={{ paddingBottom: 26, animationDelay: "2.5s" }}>
            <p className="serif" style={{ fontSize: 30, lineHeight: 1.28, color: "#F6F1E6" }}>
              A goal said aloud to someone who will ask about it is a goal more often kept.
            </p>
            <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.7, color: "rgba(246,241,230,0.76)", maxWidth: "40ch" }}>
              One partner, chosen and asked by you — and a morning inside each other&rsquo;s practices, twice a year at most.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 32 }}>
              <MagLink href="/signup" className="lpbtn solid mag">Request an introduction <Arrow /></MagLink>
              <MagLink href="#partner">How it works</MagLink>
            </div>
          </div>
        </div>

        <div className="strip hero-in" style={{ marginTop: 72, animationDelay: "2.7s" }}>
          {STRIP.map((s) => (
            <div key={s.n}>
              <p className="eb" style={{ color: "#C5B793" }}>{s.n}</p>
              <p className="serif" style={{ marginTop: 10, fontSize: 22, lineHeight: 1.3 }}>{s.line}</p>
            </div>
          ))}
          <div className="scrollcue hide-m" aria-hidden="true">
            <span className="eb" style={{ color: "rgba(246,241,230,0.64)" }}>Scroll</span>
            <i />
          </div>
        </div>
      </div>
    </section>
  );
}
