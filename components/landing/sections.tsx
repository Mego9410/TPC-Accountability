import { MARK, PHOTO } from "./photos";
import { Arrow, MagLink } from "./shell";

/* =========================================================================
   The quiet sections: the ones that hold still.
   ------------------------------------------------------------------------- */

/* ---------- Why the Club exists ----------
   One long sentence that lights up a word at a time as it crosses the
   viewport, then the answer underneath it in italic gold. Where scroll
   timelines are not supported the whole sentence simply reads cream. */
const THESIS =
  "Most principals have nobody in the building who can ask whether they did the thing they said they would do in January.";

export function Thesis() {
  const parts = THESIS.split(" ");
  return (
    <section aria-labelledby="mf-h" className="band-lg" style={{ position: "relative", overflow: "hidden", background: "#0C1217" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MARK}
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", right: -120, top: 80, width: 720, height: "auto", opacity: 0.05, pointerEvents: "none" }}
      />
      <div className="lpwrap" style={{ position: "relative" }}>
        <p id="mf-h" className="eb rv" style={{ color: "#C5B793" }}>Why the Club exists</p>
        <p className="serif words big" style={{ marginTop: 40, fontSize: 68, lineHeight: 1.12, maxWidth: "21ch", letterSpacing: "-0.005em" }}>
          {parts.map((t, i) => {
            const a = 18 + (i / parts.length) * 34;
            return (
              <span key={i} className="w" style={{ animationRange: `cover ${a.toFixed(1)}% cover ${(a + 6).toFixed(1)}%` } as React.CSSProperties}>
                {t}{" "}
              </span>
            );
          })}
        </p>
        <p className="serif rv mid" style={{ marginTop: 44, fontSize: 44, lineHeight: 1.2, fontStyle: "italic", color: "#C5B793" }}>
          A partner is one other principal who will.
        </p>
      </div>
    </section>
  );
}

/* ---------- The terms of the thing, running past ---------- */
const MARQUEE = [
  "One partner",
  "Two mornings a year",
  "Nothing scored",
  "Any request may be declined",
  "What is seen stays in the building",
  "No patient contact",
];

export function Marquee() {
  const items = [...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE];
  return (
    <div className="marq" aria-hidden="true">
      <div className="marq-track">
        {items.map((m, i) => (
          <span key={i} className="marq-item">{m} <i /></span>
        ))}
      </div>
    </div>
  );
}

/* ---------- The pull quote, on a photograph ---------- */
export function PullQuote() {
  return (
    <section className="pullquote" aria-label="Pull quote">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PHOTO.readingRoom} alt="A quiet reading room with two leather armchairs by a low fire" />
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(12,18,23,0.86) 0%, rgba(12,18,23,0.55) 45%, rgba(12,18,23,0.1) 80%)" }}
      />
      <div className="lpwrap rv" style={{ position: "relative" }}>
        {/* The measure belongs on the line itself: `ch` on the blockquote
            would resolve against its inherited 16px, not the 80px quote. */}
        <blockquote>
          <p className="serif big" style={{ fontSize: 80, lineHeight: 1.04, fontStyle: "italic", color: "#F6F1E6", maxWidth: "15ch" }}>
            Twenty years in the same building, and you stop seeing it.
          </p>
        </blockquote>
        <p className="eb" style={{ marginTop: 36, color: "#C5B793" }}>Which is why somebody else should look</p>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
const HOW = [
  {
    n: "I",
    title: "You join",
    body: "Request an introduction. The House reads it, asks you a question or two, and writes back within the week.",
    dark: false,
    whole: false,
  },
  {
    n: "II",
    title: "You find a partner",
    body: "Read the members directory, choose a principal whose year looks something like yours, and ask them. They accept, or they decline without a reason.",
    dark: false,
    whole: false,
  },
  {
    n: "III",
    title: "You share what you are working on",
    body: "The few things you are actually trying to do this year. Your partner can see them and write a word against them, and you against theirs.",
    dark: true,
    whole: true,
  },
  {
    n: "IV",
    title: "You visit each other",
    body: "A morning inside their practice, and in turn a morning inside yours. Any member, by mutual agreement, twice a year at most.",
    dark: true,
    whole: true,
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-h" className="band" style={{ background: "#F6F1E6", color: "#0C1217" }}>
      <div className="lpwrap g2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", gap: 96, alignItems: "start" }}>
        <div className="rv" style={{ position: "sticky", top: 140 }}>
          <p className="eb" style={{ color: "#71654B" }}>How it works</p>
          <h2 id="how-h" className="serif big" style={{ marginTop: 22, fontSize: 68, lineHeight: 1.04 }}>
            Four steps. The last two are the whole of it.
          </h2>
          <p style={{ marginTop: 24, fontSize: 16, lineHeight: 1.75, color: "#574F42", maxWidth: "40ch" }}>
            There is nothing to learn and nothing to keep up with. You join, you ask someone, you say what you are working
            on, and twice a year you open the door.
          </p>
        </div>

        <div className="howlist" style={{ position: "relative" }}>
          <span className="vline" aria-hidden="true"><b /></span>
          <ol style={{ listStyle: "none", padding: 0, position: "relative" }}>
            {HOW.map((s, i) => (
              <li
                key={s.n}
                className="rv"
                style={{
                  position: "relative", display: "grid", gridTemplateColumns: "64px 1fr",
                  gap: 32, paddingBottom: i === HOW.length - 1 ? 0 : 72,
                }}
              >
                <span
                  className="disp"
                  style={{
                    position: "relative", zIndex: 1, width: 64, height: 64, borderRadius: "50%",
                    background: s.dark ? "#0C1217" : "#F6F1E6",
                    border: `1px solid ${s.dark ? "#0C1217" : "#71654B"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 24, color: s.dark ? "#C5B793" : "#71654B" }}>{s.n}</span>
                </span>
                <div>
                  {s.whole && <p className="eb" style={{ color: "#71654B" }}>The whole of it</p>}
                  <p className="serif" style={{ marginTop: s.whole ? 8 : 0, fontSize: 40, lineHeight: 1.1, fontWeight: 400 }}>
                    {s.title}
                  </p>
                  <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.75, color: "#574F42", maxWidth: "48ch" }}>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- The close ---------- */
export function Closing({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <section
      aria-labelledby="close-h"
      className="closing-band" style={{ position: "relative", display: "flex", alignItems: "center", overflow: "hidden", background: "#0C1217" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="clip"
        src={PHOTO.twoPrincipals}
        alt="Two principals deep in conversation over coffee"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%" }}
      />
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 80% at 50% 55%, rgba(12,18,23,0.8), rgba(12,18,23,0.45))" }}
      />
      <div className="lpwrap rv" style={{ position: "relative", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK} alt="" style={{ width: 64, height: "auto" }} />
        <h2 id="close-h" className="serif big" style={{ marginTop: 36, fontSize: 92, lineHeight: 1, maxWidth: "14ch", fontWeight: 300 }}>
          A partner, and two mornings a year.
        </h2>
        <div style={{ display: "flex", gap: 14, marginTop: 48, flexWrap: "wrap", justifyContent: "center" }}>
          <MagLink href="/signup" className="lpbtn solid mag">Request an introduction <Arrow /></MagLink>
          <MagLink href={signedIn ? "/home" : "/login"}>{signedIn ? "Open the Ledger" : "Members sign in"}</MagLink>
        </div>
      </div>
    </section>
  );
}
