"use client";

import { useEffect, useState } from "react";
import { MARK } from "./photos";

/* =========================================================================
   I · The partner.

   The left column tells you what a partnership is in three steps; the right
   column shows the Ledger actually doing it. The tour advances itself every
   six and a half seconds and stops the moment anybody touches it, so it is
   never competing with a reader.

   Everything in the panel is a demonstration — the names and lines are
   illustrative, and the real Ledger is behind the door.
   ------------------------------------------------------------------------- */

const STEPS = [
  {
    n: "i",
    t: "You ask",
    d: "Read the members directory, find a principal whose year looks something like yours, and ask them. One partner at a time; either of you may end it.",
    screen: "Members directory",
  },
  {
    n: "ii",
    t: "You share what you are working on",
    d: "The handful of things you are actually trying to do this year, a line each. Your partner can write a word against them, and you against theirs.",
    screen: "Your list",
  },
  {
    n: "iii",
    t: "Once a month, a note",
    d: "The Club writes to you both and asks how the other is getting on. Answer it in a sentence, or leave it.",
    screen: "The monthly note",
  },
];

const MEMBERS = [
  { id: "a", ini: "RM", role: "Principal · three surgeries", work: "Working on a second site, and the rota", dist: "48 min away" },
  { id: "b", ini: "AK", role: "Principal · mixed practice", work: "Working on hygiene capacity", dist: "1 hr 05 away" },
  { id: "c", ini: "SO", role: "Principal · private, two surgeries", work: "Working on handing over reception", dist: "52 min away" },
];

const REPLIES = [
  { id: "moving", label: "Moving", msg: "Noted. Your partner sees a sentence, never a score." },
  { id: "stuck", label: "Stuck", msg: "Noted. Worth a question when you next speak." },
  { id: "leave", label: "Leave it this month", msg: "Left. There is nothing to fall behind on." },
];

export function PartnerSection() {
  const [step, setStep] = useState(0);
  const [run, setRun] = useState<"a" | "b">("a");
  const [paused, setPaused] = useState(false);
  const [asked, setAsked] = useState<Record<string, boolean>>({});
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
      setRun((r) => (r === "a" ? "b" : "a"));
    }, 6500);
    return () => clearInterval(t);
  }, [paused]);

  const stop = () => setPaused(true);
  const replyMsg = REPLIES.find((r) => r.id === reply)?.msg ?? "";

  return (
    <section id="partner" aria-labelledby="partner-h" className="band band-b180" style={{ position: "relative", background: "#FBF8F1", color: "#0C1217", overflow: "hidden" }}>
      <div className="lpwrap">
        <div className="g2 rv" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 64, alignItems: "end" }}>
          <div>
            <p className="eb" style={{ color: "#71654B" }}>I · The partner</p>
            <h2 id="partner-h" className="serif big" style={{ marginTop: 22, fontSize: 76, lineHeight: 1.02, letterSpacing: "-0.01em" }}>
              Someone who asks how it is going.
            </h2>
          </div>
          <p className="serif" style={{ fontSize: 24, lineHeight: 1.45, color: "#574F42", maxWidth: "36ch" }}>
            One other principal, found in the members directory and asked by you. You each write down the handful of things
            you are working on. Once a month the Club asks you both how the other is getting on.
          </p>
        </div>

        <div className="g2" style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", gap: 88, marginTop: 96, alignItems: "center" }}>
          <div className="steps rv" role="tablist" aria-label="How a partnership works">
            {STEPS.map((s, i) => {
              const on = step === i;
              return (
                <button
                  key={s.n}
                  className={`${on ? "is-on " : ""}${on && !paused ? `run-${run}` : ""}`}
                  role="tab"
                  aria-selected={on}
                  onClick={() => { setStep(i); stop(); }}
                >
                  <span className="bar" aria-hidden="true"><b /></span>
                  <span className="n">{s.n}</span>
                  <span className="t">{s.t}</span>
                  <span className="d">{s.d}</span>
                </button>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", paddingTop: 30, borderTop: "1px solid rgba(12,18,23,0.27)" }}>
              <a className="lpbtn ink-solid" href="/signup">Request an introduction</a>
              <button
                className="ul"
                onClick={() => setPaused((p) => !p)}
                style={{ background: "none", border: 0, cursor: "pointer", color: "#746D5F", padding: 0 }}
              >
                {paused ? "Resume the tour" : "Pause the tour"}
              </button>
            </div>
          </div>

          <div style={{ position: "relative" }} className="rv">
            <div className="app" role="tabpanel" aria-label={STEPS[step].screen}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 26px", borderBottom: "1px solid rgba(197,183,147,0.2)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={MARK} alt="" style={{ width: 20, height: "auto" }} />
                  <span className="eb" style={{ color: "#C5B793" }}>The Ledger</span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "rgba(246,241,230,0.72)" }}>{STEPS[step].screen}</span>
                  <span className="av" style={{ width: 32, height: 32, fontSize: 14 }}>You</span>
                </span>
              </div>

              <div style={{ padding: "30px 32px 34px", minHeight: 520 }}>
                {step === 0 && (
                  <div className="screen" key="s0">
                    <p className="eb" style={{ color: "rgba(246,241,230,0.72)" }}>Members directory</p>
                    <p className="serif" style={{ marginTop: 10, fontSize: 32, lineHeight: 1.15, fontWeight: 400 }}>
                      Find a principal whose year looks something like yours.
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "20px 0 8px" }}>
                      <span className="pill">Beyond thirty minutes</span>
                      <span className="pill">Two to four surgeries</span>
                      <span className="pill">Mixed practice</span>
                    </div>
                    {MEMBERS.map((m) => {
                      const on = !!asked[m.id];
                      return (
                        <div className="app-row" key={m.id}>
                          <span className="av" aria-hidden="true">{m.ini}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 15, fontWeight: 500 }}>{m.role}</p>
                            <p style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(246,241,230,0.72)" }}>{m.work}</p>
                          </div>
                          <span className="pill hide-m">{m.dist}</span>
                          <button
                            className={`mini${on ? " on" : ""}`}
                            onClick={() => { setAsked((a) => ({ ...a, [m.id]: !a[m.id] })); stop(); }}
                            aria-pressed={on}
                          >
                            {on ? "Asked" : "Ask"}
                          </button>
                        </div>
                      );
                    })}
                    <p style={{ marginTop: 18, fontSize: 13, color: "rgba(246,241,230,0.72)" }}>
                      They accept or they decline, and a decline needs no reason.
                    </p>
                  </div>
                )}

                {step === 1 && (
                  <div className="screen" key="s1">
                    <p className="eb" style={{ color: "rgba(246,241,230,0.72)" }}>What you are working on</p>
                    <p className="serif" style={{ marginTop: 10, fontSize: 32, lineHeight: 1.15, fontWeight: 400 }}>
                      A line each. Nothing to score.
                    </p>
                    <div style={{ marginTop: 22 }}>
                      <div className="app-row" style={{ alignItems: "flex-start" }}>
                        <span className="disp" style={{ fontSize: 26, color: "#C5B793", width: 32 }}>i</span>
                        <div style={{ flex: 1 }}>
                          <p className="serif" style={{ fontSize: 22, fontWeight: 400 }}>Get failed appointments under control</p>
                          <p style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "#D8C9A1" }}>
                            <span className="av" style={{ width: 28, height: 28, fontSize: 12 }}>RM</span>
                            <span className="typing">Did the reminder texts go out yet?</span>
                            <span className="caret" aria-hidden="true" />
                          </p>
                        </div>
                      </div>
                      <div className="app-row" style={{ alignItems: "flex-start" }}>
                        <span className="disp" style={{ fontSize: 26, color: "#C5B793", width: 32 }}>ii</span>
                        <div style={{ flex: 1 }}>
                          <p className="serif" style={{ fontSize: 22, fontWeight: 400 }}>Hand the rota to the practice manager</p>
                          <p style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "rgba(246,241,230,0.76)" }}>
                            <span className="av" style={{ width: 28, height: 28, fontSize: 12 }}>RM</span>
                            What is stopping you this month?
                          </p>
                        </div>
                      </div>
                      <div className="app-row" style={{ alignItems: "flex-start" }}>
                        <span className="disp" style={{ fontSize: 26, color: "#C5B793", width: 32 }}>iii</span>
                        <div style={{ flex: 1 }}>
                          <p className="serif" style={{ fontSize: 22, fontWeight: 400 }}>Decide on the second site</p>
                          <p style={{ marginTop: 8, fontSize: 13, color: "rgba(246,241,230,0.64)" }}>Nothing written against this one yet.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="screen" key="s2">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, paddingBottom: 16, borderBottom: "1px solid rgba(197,183,147,0.2)" }}>
                      <p style={{ fontSize: 13, color: "rgba(246,241,230,0.72)" }}>
                        From <span style={{ color: "#F6F1E6" }}>The House</span> · to you both
                      </p>
                      <p style={{ fontSize: 13, color: "rgba(246,241,230,0.72)" }}>Once a month</p>
                    </div>
                    <p className="serif" style={{ marginTop: 34, fontSize: 44, lineHeight: 1.08, fontWeight: 400 }}>
                      How is your partner getting on?
                    </p>
                    <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.7, color: "rgba(246,241,230,0.76)", maxWidth: "44ch" }}>
                      Answer it in a sentence, or leave it. There is nothing else to keep up with.
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 30 }}>
                      {REPLIES.map((r) => (
                        <button
                          key={r.id}
                          className={`mini${reply === r.id ? " on" : ""}`}
                          onClick={() => { setReply(r.id); stop(); }}
                          aria-pressed={reply === r.id}
                          style={{ minWidth: 0 }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <p aria-live="polite" className="serif" style={{ marginTop: 26, fontSize: 22, fontStyle: "italic", color: "#D8C9A1", minHeight: 30 }}>
                      {replyMsg}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="toast hide-m" aria-hidden="true">
              <span className="pulse" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>The monthly note</p>
                <p style={{ fontSize: 12, color: "#746D5F" }}>Sent to you both · nothing to fall behind on</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
