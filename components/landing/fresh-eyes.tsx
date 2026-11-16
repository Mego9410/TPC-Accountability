"use client";

import { useState } from "react";
import { PHOTO } from "./photos";

/* =========================================================================
   Fresh eyes.

   One photograph shown twice — dulled on the left as you have stopped
   seeing it, bright on the right as a visitor finds it — with a range input
   laid invisibly over the whole frame. A range is the right control here:
   it drags with a pointer, steps with the arrow keys and announces itself
   to a screen reader, and we get all three for nothing.
   ------------------------------------------------------------------------- */

export function FreshEyes() {
  const [split, setSplit] = useState(50);

  return (
    <section aria-labelledby="fresh-h" className="band-sm" style={{ background: "#F6F1E6", color: "#0C1217" }}>
      <div className="lpwrap g2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", gap: 88, alignItems: "center" }}>
        <div className="rv">
          <p className="eb" style={{ color: "#71654B" }}>Fresh eyes</p>
          <h2 id="fresh-h" className="serif big" style={{ marginTop: 22, fontSize: 64, lineHeight: 1.04 }}>
            The same reception, seen for the first time.
          </h2>
          <p style={{ marginTop: 22, fontSize: 16, lineHeight: 1.75, color: "#574F42", maxWidth: "42ch" }}>
            A visitor notices what you have walked past for years. That is the whole point of the morning, and why you
            return the favour.
          </p>
          <p className="eb" style={{ marginTop: 32, color: "#71654B", display: "flex", alignItems: "center", gap: 12 }}>
            <svg aria-hidden="true" width="28" height="12" viewBox="0 0 28 12" fill="none" stroke="currentColor" strokeWidth="1.25">
              <path d="M6 1L1 6l5 5M22 1l5 5-5 5M1 6h26" />
            </svg>
            Drag across the photograph
          </p>
        </div>

        <div className="compare rv" style={{ "--split": `${split}%` } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="dull" src={PHOTO.receptionPatient} alt="" draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="vivid"
            src={PHOTO.receptionPatient}
            alt="A practice reception at late morning, a receptionist talking with a patient"
            draggable={false}
          />
          <span className="tagl" style={{ left: 20 }}>You · year twenty</span>
          <span className="tagl" style={{ right: 20 }}>A visitor · day one</span>
          <span className="seam" aria-hidden="true">
            <span className="knob">
              <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M6 1L1 6l5 5M16 1l5 5-5 5" />
              </svg>
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            aria-label="Compare how the reception looks to you and to a first-time visitor"
          />
        </div>
      </div>
    </section>
  );
}
