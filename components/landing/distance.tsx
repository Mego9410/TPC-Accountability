"use client";

import { useState } from "react";
import { PHOTO } from "./photos";

/* =========================================================================
   Nobody hosts a competitor.

   The exclusion zone drawn as drive time rather than miles, which is the
   only way the rule works in both London and Norfolk. The toggle changes
   what twenty minutes means; the dots are members, and selecting one says
   whether a visit could be arranged with them.
   ------------------------------------------------------------------------- */

const IN = { t: "Inside twenty minutes", x: "Your own catchment. Nobody visits or hosts this close." };
const MID = { t: "Between twenty and thirty minutes", x: "Still too close to arrange. The House only introduces visits beyond the outer ring." };
const OUT = { t: "Beyond the outer ring", x: "Far enough not to compete. Ask them; they may accept or decline without a reason." };

const DOTS = [
  { id: "a", x: 295, y: 198, k: IN },
  { id: "b", x: 156, y: 286, k: IN },
  { id: "c", x: 353, y: 334, k: MID },
  { id: "d", x: 158, y: 99, k: MID },
  { id: "e", x: 440, y: 164, k: OUT },
  { id: "f", x: 160, y: 452, k: OUT },
  { id: "g", x: 45, y: 168, k: OUT },
];

const TERMS = [
  { t: "You host as well as visit", d: "Anyone who spends a morning in someone else's practice opens their own in return." },
  { t: "Any request may be declined", d: "For any reason, at any time. A busy week is reason enough." },
  { t: "Two visits a year at most", d: "Enough to be useful, few enough that hosting never drains a working practice." },
  { t: "No patient contact", d: "You are there to watch how the practice runs. The clinical work is not part of it." },
];

export function Distance() {
  const [place, setPlace] = useState<"london" | "norfolk">("london");
  const [dot, setDot] = useState("e");
  const cur = DOTS.find((d) => d.id === dot)!;

  return (
    <section aria-labelledby="dist-h" className="band" style={{ position: "relative", background: "#1B2830", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PHOTO.road}
        alt=""
        aria-hidden="true"
        className="hide-m"
        style={{ position: "absolute", right: 0, top: 0, width: "46%", height: "100%", objectFit: "cover", opacity: 0.32 }}
      />
      <div
        aria-hidden="true"
        className="hide-m"
        style={{ position: "absolute", right: 0, top: 0, width: "46%", height: "100%", background: "linear-gradient(90deg, #1B2830 0%, rgba(27,40,48,0.4) 60%, rgba(27,40,48,0.7) 100%)" }}
      />

      <div className="lpwrap" style={{ position: "relative" }}>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "560px minmax(0, 1fr)", gap: 96, alignItems: "center" }}>
          <div className="rv">
            <div className="mapbox">
              <span className="sweep" aria-hidden="true" />
              <svg
                role="img"
                aria-label="Your practice at the centre of two drive-time rings, twenty and thirty minutes. Visits are arranged only beyond the outer ring."
                width="520"
                height="520"
                viewBox="0 0 520 520"
                style={{ position: "absolute", inset: 0 }}
              >
                <circle cx="260" cy="260" r="250" fill="none" stroke="rgba(197,183,147,0.22)" strokeDasharray="2 7" />
                <circle cx="260" cy="260" r="180" fill="rgba(12,18,23,0.35)" />
                <circle className="ring-draw" cx="260" cy="260" r="180" fill="none" stroke="#C5B793" strokeWidth="1" />
                <circle className="ring-draw" cx="260" cy="260" r="120" fill="none" stroke="#C5B793" strokeWidth="1" style={{ animationDelay: ".9s" }} />
                <line x1="260" y1="10" x2="260" y2="510" stroke="rgba(197,183,147,0.12)" />
                <line x1="10" y1="260" x2="510" y2="260" stroke="rgba(197,183,147,0.12)" />
                <circle cx="260" cy="260" r="7" fill="#C5B793" />
                <text x="260" y="290" textAnchor="middle" fill="#F6F1E6" style={{ font: "500 11px var(--font-sans)", letterSpacing: "0.22em" }}>YOU</text>
                <text x="268" y="134" fill="#C5B793" style={{ font: "500 11px var(--font-sans)", letterSpacing: "0.22em" }}>20 MIN</text>
                <text x="268" y="150" fill="rgba(246,241,230,0.76)" style={{ font: "400 11px var(--font-sans)", letterSpacing: "0.08em" }}>
                  {place === "london" ? "≈ 3 MILES" : "≈ 20 MILES"}
                </text>
                <text x="268" y="74" fill="#C5B793" style={{ font: "500 11px var(--font-sans)", letterSpacing: "0.22em" }}>30 MIN</text>
              </svg>
              {DOTS.map((d) => (
                <button
                  key={d.id}
                  className={`mdot ${d.k === OUT ? "out" : "in"}${dot === d.id ? " is-on" : ""}`}
                  onClick={() => setDot(d.id)}
                  aria-label={`A member, ${d.k.t.toLowerCase()}`}
                  aria-pressed={dot === d.id}
                  style={{ left: d.x, top: d.y }}
                >
                  <span />
                </button>
              ))}
            </div>
          </div>

          <div className="rv">
            <p className="eb" style={{ color: "#C5B793" }}>Nobody hosts a competitor</p>
            <h2 id="dist-h" className="serif big" style={{ marginTop: 22, fontSize: 64, lineHeight: 1.04 }}>
              Far enough not to compete. Close enough to drive.
            </h2>
            <p style={{ marginTop: 22, fontSize: 16, lineHeight: 1.75, color: "rgba(246,241,230,0.8)", maxWidth: "48ch" }}>
              Visits are only arranged beyond twenty to thirty minutes&rsquo; drive. It is measured in journey time rather
              than miles, which is why it works as well in Norfolk as in London.
            </p>
            <div className="seg" role="group" aria-label="Where is your practice?" style={{ marginTop: 32 }}>
              {(["london", "norfolk"] as const).map((p) => (
                <button key={p} className={place === p ? "is-on" : ""} onClick={() => setPlace(p)} aria-pressed={place === p}>
                  {p === "london" ? "London" : "Norfolk"}
                </button>
              ))}
            </div>
            <p className="serif" style={{ marginTop: 18, fontSize: 24, fontStyle: "italic", color: "#D8C9A1" }}>
              {place === "london"
                ? "In London, twenty minutes covers about three miles."
                : "In Norfolk, twenty minutes covers about twenty."}
            </p>
            <div
              aria-live="polite"
              style={{ marginTop: 36, padding: "26px 28px", border: "1px solid rgba(197,183,147,0.35)", borderRadius: 4, background: "rgba(12,18,23,0.35)", maxWidth: 520 }}
            >
              <p className="eb" style={{ color: "#C5B793" }}>{cur.k.t}</p>
              <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.7, color: "rgba(246,241,230,0.84)" }}>{cur.k.x}</p>
            </div>
            <p style={{ marginTop: 14, fontSize: 13, color: "rgba(246,241,230,0.72)" }}>Select any member on the map.</p>
          </div>
        </div>

        <div className="rv" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 36, marginTop: 120 }}>
          {TERMS.map((t) => (
            <div key={t.t} style={{ paddingTop: 20, borderTop: "1px solid rgba(197,183,147,0.35)" }}>
              <p className="serif" style={{ fontSize: 24, fontWeight: 400 }}>{t.t}</p>
              <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "rgba(246,241,230,0.76)" }}>{t.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
