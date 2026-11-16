"use client";

import { useRef, useState } from "react";
import { STAGES, STAGE_SPAN } from "./photos";

/* =========================================================================
   II · The visit.

   The morning as a filmstrip you can drag, with a ruler underneath set to
   real clock time rather than even spacing — the gap between 9.30 and 11.00
   is wider than the gap between 8.40 and 9.00 because the morning is.

   The strip is a focusable region with arrow-key support, and every card is
   a real button, so nothing here needs a pointer.
   ------------------------------------------------------------------------- */

export function Morning() {
  const [idx, setIdx] = useState(0);
  const downX = useRef<number | null>(null);
  const dragged = useRef(false);
  const last = STAGES.length - 1;

  const clamp = (n: number) => Math.max(0, Math.min(last, n));
  const fill = `${((STAGES[idx].m / STAGE_SPAN) * 100).toFixed(2)}%`;

  return (
    <section id="visits" aria-labelledby="visits-h" className="band band-b150" style={{ background: "#121B22", overflow: "hidden" }}>
      <div className="lpwrap">
        <div className="g2 rv" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: 64, alignItems: "end" }}>
          <div>
            <p className="eb" style={{ color: "#C5B793" }}>II · The visit</p>
            <h2 id="visits-h" className="serif big" style={{ marginTop: 22, fontSize: 76, lineHeight: 1.02, letterSpacing: "-0.01em" }}>
              A morning inside someone else&rsquo;s practice. <em style={{ color: "#C5B793" }}>And then yours.</em>
            </h2>
          </div>
          <p className="serif" style={{ fontSize: 24, lineHeight: 1.45, color: "rgba(246,241,230,0.78)", maxWidth: "36ch" }}>
            How the day is set, how the diary holds together, how reception talks to patients, how the team works. Then you
            do the same for them. Twice a year at most.
          </p>
        </div>

        <div className="rv" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginTop: 96, flexWrap: "wrap" }}>
          <div>
            <p className="eb" style={{ color: "#C5B793" }}>A morning, as it tends to go</p>
            <p style={{ marginTop: 8, fontSize: 13, color: "rgba(246,241,230,0.72)" }}>
              Roughly. Your host decides what they are happy to show.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="disp" style={{ fontSize: 28, color: "#C5B793", minWidth: 90, textAlign: "right" }}>
              {`0${idx + 1} / 0${STAGES.length}`}
            </span>
            <button className="ctl" onClick={() => setIdx((i) => clamp(i - 1))} aria-label="Previous moment">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25"><path d="M11 3L5 9l6 6" /></svg>
            </button>
            <button className="ctl" onClick={() => setIdx((i) => (i >= last ? 0 : i + 1))} aria-label="Next moment">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25"><path d="M7 3l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className="film"
        role="region"
        aria-label="The morning programme. Drag, or use the arrow keys."
        tabIndex={0}
        onPointerDown={(e) => { downX.current = e.clientX; }}
        onPointerLeave={() => { downX.current = null; }}
        onPointerUp={(e) => {
          if (downX.current == null) return;
          const dx = e.clientX - downX.current;
          downX.current = null;
          dragged.current = Math.abs(dx) > 50;
          if (dx < -50) setIdx((i) => clamp(i + 1));
          else if (dx > 50) setIdx((i) => clamp(i - 1));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); setIdx((i) => clamp(i + 1)); }
          if (e.key === "ArrowLeft") { e.preventDefault(); setIdx((i) => clamp(i - 1)); }
        }}
        style={{ marginTop: 40, paddingLeft: "max(56px, calc((100% - 1440px) / 2 + 56px))" }}
      >
        <div className="film-track" style={{ transform: `translateX(calc(${idx} * (var(--cw) + 28px) * -1))` }}>
          {STAGES.map((st, i) => (
            <button
              key={st.time}
              className={`fcard${idx === i ? " is-on" : ""}`}
              onClick={() => { if (dragged.current) { dragged.current = false; return; } setIdx(i); }}
              aria-current={idx === i}
            >
              <span className="ph">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={st.img} alt={st.alt} loading="lazy" draggable={false} />
              </span>
              <span style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 26 }}>
                <span className="disp" style={{ fontSize: 64, lineHeight: 1, color: "#C5B793" }}>{st.time}</span>
                <span className="serif" style={{ fontSize: 32, fontWeight: 400 }}>{st.title}</span>
              </span>
              <span style={{ display: "block", marginTop: 12, fontSize: 15, lineHeight: 1.7, color: "rgba(246,241,230,0.78)", maxWidth: "46ch" }}>
                {st.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="lpwrap">
        <div className="ruler hide-m" style={{ marginTop: 56 }} role="tablist" aria-label="Jump to a time">
          <span className="base" aria-hidden="true" />
          <span className="fill" aria-hidden="true" style={{ width: fill }} />
          {STAGES.map((st, i) => (
            <button
              key={st.time}
              className={`tick${i === 0 ? " first" : ""}${i === STAGES.length - 1 ? " last" : ""}${idx === i ? " is-on" : ""}`}
              role="tab"
              aria-selected={idx === i}
              onClick={() => setIdx(i)}
              style={{ left: `${((st.m / STAGE_SPAN) * 100).toFixed(2)}%` }}
              aria-label={`${st.time} ${st.title}`}
            >
              <span>{st.time}</span>
              <span className="dot" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
