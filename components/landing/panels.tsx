"use client";

import { useState } from "react";
import { PHOTO } from "./photos";

/* =========================================================================
   The two things the Club is made of.

   Two photographic panels that open: hovering gives one of them more of the
   row, and clicking pins it, so a touch device and a keyboard can reach the
   same state a pointer gets for free. Below 1000px they stack and both read
   in full.
   ------------------------------------------------------------------------- */

const PANELS = [
  {
    num: "I",
    eb: "The partner",
    title: "Someone who asks how it is going.",
    text:
      "Another principal you pick out of the directory and ask yourself. You each share what you are working on, and once a month the Club asks you both how the other is getting on.",
    href: "#partner",
    img: PHOTO.notebook,
    alt: "A hand writing a short list in a green leather notebook",
  },
  {
    num: "II",
    eb: "The visit",
    title: "A morning inside another practice.",
    text:
      "The workflow, the systems, the feel of how someone else has built their culture — and, in turn, a morning inside yours.",
    href: "#visits",
    img: PHOTO.frontDoor,
    alt: "A hand pushing open a green Georgian front door",
  },
];

export function Pillars() {
  const [open, setOpen] = useState(0);

  return (
    <section aria-labelledby="two-h" className="band-md" style={{ background: "#F6F1E6", color: "#0C1217" }}>
      <div className="lpwrap">
        <div className="g2 rv" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", gap: 64, alignItems: "end" }}>
          <div>
            <p className="eb" style={{ color: "#71654B" }}>The Club</p>
            <h2 id="two-h" className="serif big" style={{ marginTop: 22, fontSize: 84, lineHeight: 1, letterSpacing: "-0.01em" }}>
              Two things. <em style={{ color: "#71654B" }}>Nothing else.</em>
            </h2>
          </div>
          <p className="serif" style={{ fontSize: 24, lineHeight: 1.45, color: "#574F42", maxWidth: "34ch", paddingBottom: 8 }}>
            You will not find a programme, a scoring system or a set of weekly targets anywhere in it.
          </p>
        </div>

        <div className="panels" style={{ marginTop: 72 }}>
          {PANELS.map((p, i) => (
            <article key={p.num} className={`panel${open === i ? " is-open" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt={p.alt} />
              <div className="shade" aria-hidden="true" />
              <button
                className="toggle"
                onClick={() => setOpen(i)}
                aria-label={`Open ${p.eb.toLowerCase()}`}
                aria-pressed={open === i}
              />
              <span
                className="disp"
                aria-hidden="true"
                style={{ position: "absolute", left: 40, top: 30, fontSize: 120, lineHeight: 1, color: "#C5B793", zIndex: 2, pointerEvents: "none" }}
              >
                {p.num}
              </span>
              <div className="body" style={{ pointerEvents: "none" }}>
                <p className="eb" style={{ color: "#C5B793" }}>{p.eb}</p>
                <h3 className="serif" style={{ fontSize: 44, lineHeight: 1.05, fontWeight: 400 }}>{p.title}</h3>
                <p className="more" style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(246,241,230,0.86)" }}>{p.text}</p>
                <a className="ul more" href={p.href} style={{ color: "#C5B793", pointerEvents: "auto" }}>Read on</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
