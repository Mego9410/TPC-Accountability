"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { MARK, PHOTO, WORDMARK } from "@/components/landing/photos";
import "./introduction.css";

/* =========================================================================
   Request an introduction.

   Four steps, each validated before it will let you past, then the
   undertakings and the seal. Nothing is sent until the last step, and the
   House is told plainly what it is being told.

   The design does not show a password field, because a mock-up does not
   need an account at the end of it. This one does, so it sits in step I
   beside the email it belongs with.
   ------------------------------------------------------------------------- */

type Fields = {
  name: string; email: string; password: string; gdc: string; phone: string;
  practice: string; town: string; postcode: string; surgeries: string; kind: string;
  g1: string; g2: string; g3: string;
};

const EMPTY: Fields = {
  name: "", email: "", password: "", gdc: "", phone: "",
  practice: "", town: "", postcode: "", surgeries: "", kind: "",
  g1: "", g2: "", g3: "",
};

const LABELS = ["You", "Your practice", "Your year", "Undertakings"];
const NUMS = ["I", "II", "III", "IV"];
const STEP_FIELDS: (keyof Fields)[][] = [
  ["name", "email", "password", "gdc"],
  ["practice", "town", "postcode"],
  ["g1"],
  [],
];

const CHECKS = [
  { title: "I am the principal, or an owner, of the practice.", text: "The Club is for the person who runs the building." },
  { title: "If I spend a morning in a member’s practice, I will host one in return.", text: "Everyone does both, twice a year at most." },
  { title: "What I see in another member’s building stays in it.", text: "Both principals give the same undertaking, and it does not lapse afterwards." },
];

function validate(f: Fields): Partial<Record<keyof Fields, string>> {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (!f.name.trim()) e.name = "Please add your name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = "That email address is not recognised. Please check it.";
  if (f.password.length < 6) e.password = "Six characters or more, please.";
  if (!/^\d{4,6}$/.test(f.gdc.trim())) e.gdc = "A GDC number is four to six digits.";
  if (!f.practice.trim()) e.practice = "Please add the practice name.";
  if (!f.town.trim()) e.town = "Please add the town or city.";
  if (f.postcode.trim().length < 5) e.postcode = "Please add the full postcode.";
  if (!f.g1.trim()) e.g1 = "One line is enough, but one is needed.";
  return e;
}

export function Introduction() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);
  const [tried, setTried] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [checkTried, setCheckTried] = useState(false);
  const [checks, setChecks] = useState([false, false, false]);
  const [f, setF] = useState<Fields>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const errs = validate(f);
  const set = (k: keyof Fields) => (ev: { target: { value: string } }) =>
    setF((prev) => ({ ...prev, [k]: ev.target.value }));

  const err = (k: keyof Fields) => (tried[k] && errs[k] ? errs[k] : null);
  const cls = (k: keyof Fields) => (err(k) ? "field bad" : "field");

  function next(ev?: FormEvent) {
    ev?.preventDefault();
    const fs = STEP_FIELDS[step];
    setTried((t) => ({ ...t, ...Object.fromEntries(fs.map((k) => [k, true])) }));
    if (fs.some((k) => errs[k])) return;
    setStep((s) => s + 1);
  }

  async function send(ev: FormEvent) {
    ev.preventDefault();
    if (busy) return;
    if (checks.includes(false)) { setCheckTried(true); return; }
    setFailure(null);

    // Without records to write to, the request is a demonstration and says so.
    if (!env.supabase.isConfigured) { setSent(true); return; }

    setBusy(true);
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : env.siteUrl;
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        // Everything the four steps collected travels with the account, so
        // the particulars page can offer it back rather than ask twice.
        data: {
          full_name: f.name.trim(),
          wants: "mentee",
          gdc_number: f.gdc.trim(),
          phone: f.phone.trim(),
          practice_name: f.practice.trim(),
          town: f.town.trim(),
          postcode: f.postcode.trim().toUpperCase(),
          surgeries: f.surgeries,
          practice_kind: f.kind,
          goals: [f.g1, f.g2, f.g3].map((g) => g.trim()).filter(Boolean),
        },
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/onboarding")}`,
      },
    });

    if (error) {
      setBusy(false);
      setFailure(
        /already registered/i.test(error.message)
          ? "That address is already known to the Club. Please sign in instead."
          : error.message
      );
      return;
    }
    if (data.session) { router.push("/onboarding"); router.refresh(); return; }
    setBusy(false);
    setSent(true);
  }

  return (
    <div className="ri">
      <aside className="side" aria-label="About introductions">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bg" src={PHOTO.frontDoor} alt="" />
        <div className="shade" aria-hidden="true" />
        <Link href="/" aria-label="Back to the Club's home page" style={{ position: "relative", display: "flex", alignItems: "center", gap: 16, textDecoration: "none", minHeight: 44 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} alt="" style={{ width: 34, height: "auto" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={WORDMARK} alt="The Principals Club" style={{ width: 210, height: "auto" }} />
        </Link>

        <div style={{ position: "relative" }}>
          <p className="eb" style={{ color: "#C5B793" }}>Request an introduction</p>
          <p className="serif big" style={{ marginTop: 22, fontSize: 54, lineHeight: 1.06, maxWidth: "15ch" }}>
            The House reads every request, and writes back within the week.
          </p>
          <ol style={{ listStyle: "none", padding: 0, marginTop: 44, display: "flex", flexDirection: "column", gap: 14 }}>
            {LABELS.map((l, i) => {
              const on = sent || i <= step;
              return (
                <li key={l} style={{ display: "flex", alignItems: "baseline", gap: 18, color: on ? "#F6F1E6" : "rgba(246,241,230,0.62)" }}>
                  <span className="disp" style={{ fontSize: 22, width: 34, color: on ? "#C5B793" : "rgba(197,183,147,0.62)" }}>{NUMS[i]}</span>
                  <span style={{ fontSize: 15, letterSpacing: "0.02em" }}>{l}</span>
                </li>
              );
            })}
          </ol>
          <p style={{ marginTop: 44, paddingTop: 22, borderTop: "1px solid rgba(197,183,147,0.35)", fontSize: 13, lineHeight: 1.7, color: "rgba(246,241,230,0.76)", maxWidth: "44ch" }}>
            One kind of member. No tiers. Terms and pricing are being settled with the founding members.
          </p>
        </div>
      </aside>

      <main className="main">
        <div className="form">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <Link href="/" className="btn ghost" style={{ paddingLeft: 0 }}>← The Club</Link>
            <p className="eb" style={{ color: "#71654B" }}>{sent ? "Sent" : `Step ${NUMS[step]} of IV`}</p>
          </div>

          {!sent && (
            <nav className="prog" aria-label="Progress" style={{ marginTop: 28 }}>
              {LABELS.map((l, i) => (
                <button
                  key={l}
                  className={i === step ? "now" : i < step ? "done" : ""}
                  onClick={() => { if (i <= step) setStep(i); }}
                  disabled={i > step}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span className="disp" style={{ fontSize: 20 }}>{NUMS[i]}</span>
                  <span className="lbl-text eb" style={{ fontSize: 10 }}>{l}</span>
                </button>
              ))}
            </nav>
          )}

          {!sent && step === 0 && (
            <form className="pane" onSubmit={next} noValidate style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 26 }}>
              <div>
                <p className="eb" style={{ color: "#71654B" }}>I · You</p>
                <h1 className="serif big" style={{ marginTop: 14, fontSize: 52, lineHeight: 1.05 }}>First, who is asking.</h1>
              </div>
              <div className={cls("name")}>
                <label htmlFor="f-name">Full name</label>
                <input id="f-name" autoComplete="name" value={f.name} onChange={set("name")} />
                {err("name") && <p className="err">{err("name")}</p>}
              </div>
              <div className={cls("email")}>
                <label htmlFor="f-email">Email</label>
                <input id="f-email" type="email" autoComplete="email" value={f.email} onChange={set("email")} />
                {err("email") && <p className="err">{err("email")}</p>}
              </div>
              <div className={cls("password")}>
                <label htmlFor="f-pw">Choose a password</label>
                <input id="f-pw" type="password" autoComplete="new-password" value={f.password} onChange={set("password")} />
                {err("password") ? <p className="err">{err("password")}</p> : <p className="hint">Six characters or more. It is how you will sign in.</p>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 20 }}>
                <div className={cls("gdc")}>
                  <label htmlFor="f-gdc">GDC number</label>
                  <input id="f-gdc" inputMode="numeric" value={f.gdc} onChange={set("gdc")} />
                  {err("gdc") ? <p className="err">{err("gdc")}</p> : <p className="hint">Every member is a registered principal.</p>}
                </div>
                <div className="field">
                  <label htmlFor="f-phone">Mobile <span style={{ textTransform: "none", letterSpacing: 0, color: "#746D5F" }}>(optional)</span></label>
                  <input id="f-phone" type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn solid" type="submit">Continue <span aria-hidden="true">→</span></button>
              </div>
            </form>
          )}

          {!sent && step === 1 && (
            <form className="pane" onSubmit={next} noValidate style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 26 }}>
              <div>
                <p className="eb" style={{ color: "#71654B" }}>II · Your practice</p>
                <h1 className="serif big" style={{ marginTop: 14, fontSize: 52, lineHeight: 1.05 }}>The building you run.</h1>
              </div>
              <div className={cls("practice")}>
                <label htmlFor="f-practice">Practice name</label>
                <input id="f-practice" value={f.practice} onChange={set("practice")} />
                {err("practice") && <p className="err">{err("practice")}</p>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 20 }}>
                <div className={cls("town")}>
                  <label htmlFor="f-town">Town or city</label>
                  <input id="f-town" value={f.town} onChange={set("town")} />
                  {err("town") && <p className="err">{err("town")}</p>}
                </div>
                <div className={cls("postcode")}>
                  <label htmlFor="f-pc">Postcode</label>
                  <input id="f-pc" autoComplete="postal-code" value={f.postcode} onChange={set("postcode")} />
                  {err("postcode") ? <p className="err">{err("postcode")}</p> : <p className="hint">Used only to keep visits outside your catchment.</p>}
                </div>
              </div>
              <Chips legend="Surgeries" id="surg" options={["1", "2", "3", "4", "5+"]} value={f.surgeries} onPick={(v) => setF((p) => ({ ...p, surgeries: v }))} />
              <Chips legend="The practice is" id="kind" options={["NHS", "Mixed", "Private"]} value={f.kind} onPick={(v) => setF((p) => ({ ...p, kind: v }))} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button className="btn ghost" type="button" onClick={() => setStep((s) => Math.max(0, s - 1))}>← Back</button>
                <button className="btn solid" type="submit">Continue <span aria-hidden="true">→</span></button>
              </div>
            </form>
          )}

          {!sent && step === 2 && (
            <form className="pane" onSubmit={next} noValidate style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <p className="eb" style={{ color: "#71654B" }}>III · Your year</p>
                <h1 className="serif big" style={{ marginTop: 14, fontSize: 52, lineHeight: 1.05 }}>What you are trying to do this year.</h1>
                <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.7, color: "#574F42" }}>
                  A line each. This is what a partner would ask you about. One is enough.
                </p>
              </div>
              <div className={`line ${cls("g1")}`}>
                <span className="disp" aria-hidden="true" style={{ fontSize: 26, color: "#71654B" }}>i</span>
                <input aria-label="First thing you are working on" value={f.g1} onChange={set("g1")} placeholder="e.g. Get failed appointments under control" />
              </div>
              {err("g1") && <p className="err" style={{ fontSize: 13, color: "#8B3A3A", paddingLeft: 48 }}>{err("g1")}</p>}
              <div className="line field">
                <span className="disp" aria-hidden="true" style={{ fontSize: 26, color: "#71654B" }}>ii</span>
                <input aria-label="Second thing you are working on" value={f.g2} onChange={set("g2")} />
              </div>
              <div className="line field">
                <span className="disp" aria-hidden="true" style={{ fontSize: 26, color: "#71654B" }}>iii</span>
                <input aria-label="Third thing you are working on" value={f.g3} onChange={set("g3")} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button className="btn ghost" type="button" onClick={() => setStep((s) => Math.max(0, s - 1))}>← Back</button>
                <button className="btn solid" type="submit">Continue <span aria-hidden="true">→</span></button>
              </div>
            </form>
          )}

          {!sent && step === 3 && (
            <form className="pane" onSubmit={send} noValidate style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <p className="eb" style={{ color: "#71654B" }}>IV · The undertakings</p>
                <h1 className="serif big" style={{ marginTop: 14, fontSize: 52, lineHeight: 1.05 }}>What the Club asks.</h1>
              </div>
              <div>
                {CHECKS.map((c, i) => (
                  <label className="check" key={c.title}>
                    <input
                      type="checkbox"
                      checked={checks[i]}
                      onChange={() => setChecks((cs) => cs.map((v, j) => (j === i ? !v : v)))}
                    />
                    <span>
                      <span className="serif" style={{ display: "block", fontSize: 22, lineHeight: 1.3, fontWeight: 400 }}>{c.title}</span>
                      <span style={{ display: "block", marginTop: 4, fontSize: 13, lineHeight: 1.6, color: "#574F42" }}>{c.text}</span>
                    </span>
                  </label>
                ))}
              </div>
              {checkTried && checks.includes(false) && (
                <p style={{ fontSize: 13, color: "#8B3A3A" }}>Each undertaking is needed before the House can put you forward.</p>
              )}
              {failure && <p style={{ fontSize: 14, color: "#8B3A3A" }}>{failure}</p>}
              <div style={{ padding: "22px 24px", background: "#FBF8F1", border: "1px solid rgba(12,18,23,0.27)", borderRadius: 2 }}>
                <p className="eb" style={{ color: "#71654B" }}>Your request</p>
                <p className="serif" style={{ marginTop: 10, fontSize: 22, fontWeight: 400 }}>{f.name || "Your name"}</p>
                <p style={{ marginTop: 4, fontSize: 14, color: "#574F42" }}>
                  {[f.practice, f.town].filter(Boolean).join(", ") || "Your practice"}
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <button className="btn ghost" type="button" onClick={() => setStep((s) => Math.max(0, s - 1))}>← Back</button>
                <button className="btn solid" type="submit" disabled={busy} aria-busy={busy}>
                  {busy ? "One moment" : "Send to the House"}
                </button>
              </div>
            </form>
          )}

          {sent && (
            <div className="pane" style={{ marginTop: 120, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 28 }}>
              <span className="seal">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MARK} alt="" style={{ width: 44, height: "auto" }} />
              </span>
              <p className="eb" style={{ color: "#71654B" }}>Received</p>
              <h1 className="serif big" style={{ fontSize: 64, lineHeight: 1.02, maxWidth: "14ch" }}>You have been put forward.</h1>
              <p className="serif" style={{ fontSize: 24, lineHeight: 1.45, color: "#574F42", maxWidth: "32ch" }}>
                {env.supabase.isConfigured
                  ? "Confirm your address by the email just sent. The House will read your request, ask you a question or two, and write back within the week."
                  : "The Club’s records are not connected yet, so nothing has been filed. The House is still being set up."}
              </p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
                <Link className="btn solid" href="/">Back to the Club</Link>
                <button
                  className="btn"
                  onClick={() => { setSent(false); setStep(0); setTried({}); setCheckTried(false); setChecks([false, false, false]); }}
                >
                  Start again
                </button>
              </div>
            </div>
          )}

          {!sent && (
            <p style={{ marginTop: 40, fontSize: 13, color: "#746D5F" }}>
              Already a member? <Link href="/login" style={{ color: "#0C1217" }}>Sign in</Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function Chips({
  legend, id, options, value, onPick,
}: {
  legend: string; id: string; options: string[]; value: string; onPick: (v: string) => void;
}) {
  return (
    <div className="field">
      <span className="lbl" id={`l-${id}`}>{legend}</span>
      <div className="chips" role="group" aria-labelledby={`l-${id}`}>
        {options.map((o) => (
          <button key={o} type="button" className={value === o ? "on" : ""} aria-pressed={value === o} onClick={() => onPick(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
