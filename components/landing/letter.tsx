"use client";

import { useState } from "react";
import { MARK, PHOTO } from "./photos";

/* =========================================================================
   Membership, as a letter that turns over.

   The front is the sealed envelope; the back is what membership includes
   and what it asks. Both faces are in the DOM, so `aria-hidden` moves with
   the flip to keep the hidden one out of the reading order.
   ------------------------------------------------------------------------- */

const INCLUDES = [
  "A partner, once you find one and they agree",
  "Two companion visits a year, with any member",
  "The members directory",
  "Correspondence with your partner and the House",
];

const ASKS = [
  "Answer the monthly note",
  "Be honest about what has not moved",
  "Host a morning in return",
  "Keep what you see inside the building",
];

export function Membership() {
  const [flipped, setFlipped] = useState(false);

  return (
    <section id="membership" aria-labelledby="mem-h" className="band" style={{ background: "#ECE5D2", color: "#0C1217", overflow: "hidden" }}>
      <div className="lpwrap g2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 96, alignItems: "center" }}>
        <div className="rv">
          <p className="eb" style={{ color: "#71654B" }}>Membership</p>
          <h2 id="mem-h" className="serif big" style={{ marginTop: 22, fontSize: 76, lineHeight: 1.02 }}>
            One kind of member, admitted by introduction.
          </h2>
          <p className="serif" style={{ marginTop: 28, fontSize: 26, lineHeight: 1.4, color: "#574F42", maxWidth: "30ch" }}>
            There are no tiers or upgrades. Every member has the same two things.
          </p>
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(12,18,23,0.46)", display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#574F42", maxWidth: "32ch" }}>
              Terms and pricing are being settled with the founding members.
            </p>
            <a className="ul" href="/membership" style={{ color: "#0C1217" }}>Membership in full</a>
          </div>
        </div>

        <div
          className="flipwrap rv"
          onMouseMove={(e) => {
            const el = e.currentTarget;
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            el.style.setProperty("--tx", `${((x - 0.5) * 12).toFixed(2)}deg`);
            el.style.setProperty("--ty", `${((0.5 - y) * 9).toFixed(2)}deg`);
            el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
            el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty("--tx", "0deg");
            e.currentTarget.style.setProperty("--ty", "0deg");
          }}
        >
          <div className="tilt">
            <div className={`flip${flipped ? " is-flipped" : ""}`}>
              <div className="face front" aria-hidden={flipped}>
                <span className="sheen" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTO.sealedLetter}
                  alt="A sealed cream envelope with a gold wax seal on a walnut desk"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,18,23,0.1) 30%, rgba(12,18,23,0.88) 100%)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 40, display: "flex", flexDirection: "column", gap: 18, color: "#F6F1E6" }}>
                  <p className="eb" style={{ color: "#C5B793" }}>By introduction</p>
                  <p className="serif" style={{ fontSize: 40, lineHeight: 1.08, fontWeight: 400 }}>
                    What membership includes, and what it asks of you.
                  </p>
                  <button className="lpbtn solid" onClick={() => setFlipped(true)} style={{ alignSelf: "flex-start" }} tabIndex={flipped ? -1 : 0}>
                    Open the letter
                  </button>
                </div>
              </div>

              <div className="face back" aria-hidden={!flipped}>
                <div style={{ padding: "44px 44px 40px", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={MARK} alt="" style={{ width: 34, height: "auto" }} />
                    <button
                      onClick={() => setFlipped(false)}
                      aria-label="Close the letter"
                      tabIndex={flipped ? 0 : -1}
                      style={{ width: 44, height: 44, border: "1px solid rgba(12,18,23,0.27)", borderRadius: "50%", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#0C1217" }}
                    >
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                        <path d="M2 2l10 10M12 2L2 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="letter-cols" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 28, marginTop: 34, flex: 1 }}>
                    <div>
                      <p className="eb" style={{ color: "#71654B" }}>It includes</p>
                      <ul style={{ listStyle: "none", padding: 0, marginTop: 14 }}>
                        {INCLUDES.map((t) => (
                          <li key={t} className="serif" style={{ fontSize: 19, lineHeight: 1.35, padding: "12px 0", borderTop: "1px solid rgba(12,18,23,0.27)", fontWeight: 400 }}>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="eb" style={{ color: "#71654B" }}>It asks</p>
                      <ul style={{ listStyle: "none", padding: 0, marginTop: 14 }}>
                        {ASKS.map((t) => (
                          <li key={t} className="serif" style={{ fontSize: 19, lineHeight: 1.35, padding: "12px 0", borderTop: "1px solid rgba(12,18,23,0.27)", fontWeight: 400 }}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", paddingTop: 22, borderTop: "1px solid rgba(12,18,23,0.46)" }}>
                    <p className="eb" style={{ color: "#71654B" }}>One kind of member</p>
                    <a className="lpbtn ink-solid" href="/signup" tabIndex={flipped ? 0 : -1}>Request an introduction</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
