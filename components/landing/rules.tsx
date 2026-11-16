"use client";

import Link from "next/link";
import { PHOTO } from "./photos";

/* =========================================================================
   Three of the seven house rules.

   A photograph follows the pointer across the list and wipes in under
   whichever rule is being read. It is decorative and pointer-only: the rules
   themselves are plain text in the document, and the floating frame is
   hidden below 1000px and to anything without a fine pointer.
   ------------------------------------------------------------------------- */

const RULES = [
  {
    n: "i",
    rule: "A partner is there to ask questions.",
    why: "A question is usually more use than advice nobody asked for. Nothing you share is scored or ranked, and none of it is held against you.",
  },
  {
    n: "ii",
    rule: "Any request may be declined, without a reason.",
    why: "A partnership, a visit or a proposed date can all be refused. Declining is expected and is not recorded against you.",
  },
  {
    n: "iii",
    rule: "What is seen in the building stays in it.",
    why: "Both principals give the same undertaking before a visit is arranged, and it does not lapse afterwards.",
  },
];

const FLOATS = [PHOTO.readingRoom, PHOTO.frontDoor, PHOTO.sealedLetter];

export function HouseRules() {
  return (
    <section
      className="rules"
      aria-labelledby="rules-h"
      onMouseMove={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--rx", `${e.clientX - r.left}px`);
        el.style.setProperty("--ry", `${e.clientY - r.top}px`);
      }}
      style={{ background: "#FBF8F1", color: "#0C1217" }}
    >
      <div className="rfloat" aria-hidden="true">
        {FLOATS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} className={`i${i + 1}`} src={src} alt="" />
        ))}
      </div>

      <div className="lpwrap">
        <div className="rv" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, flexWrap: "wrap", marginBottom: 48 }}>
          <div>
            <p className="eb" style={{ color: "#71654B" }}>House rules</p>
            <h2 id="rules-h" className="serif big" style={{ marginTop: 22, fontSize: 68, lineHeight: 1.04 }}>Three of the seven.</h2>
          </div>
          <Link className="ul" href="/house-rules" style={{ color: "#0C1217" }}>All seven rules</Link>
        </div>

        {RULES.map((r, i) => (
          <div
            key={r.n}
            className={`rule-row rv r${i + 1}`}
            style={i === RULES.length - 1 ? { borderBottom: "1px solid rgba(12,18,23,0.46)" } : undefined}
          >
            <span className="disp" style={{ fontSize: 48, lineHeight: 1, color: "#71654B" }}>{r.n}</span>
            <p className="serif mid" style={{ fontSize: 44, lineHeight: 1.1, fontWeight: 400 }}>
              <span className="rt">{r.rule}</span>
            </p>
            <p className="why" style={{ fontSize: 15, lineHeight: 1.75, color: "#574F42" }}>{r.why}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
