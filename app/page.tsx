import Link from "next/link";
import { Body, Button, Caption, Divider, Eyebrow, H2, H3 } from "@/components/ui";

export default function TheDoor() {
  return (
    <div>
      {/* ---- Header ---- */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px clamp(20px, 5vw, 64px)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/monogram-gold.png" alt="" style={{ height: 34 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark-gold.png" alt="The Principals Club" style={{ height: 14 }} />
        </Link>
        <Button href="/login" variant="secondary" size="sm" onDark>
          Sign in
        </Button>
      </header>

      {/* ---- Hero ---- */}
      <section
        style={{
          position: "relative",
          minHeight: "100dvh",
          background: "var(--tpc-midnight)",
          color: "var(--fg)",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          padding: "120px 24px 96px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/monogram-gold.png"
          alt=""
          style={{
            position: "absolute",
            inset: "auto -8% -22% auto",
            width: 680,
            maxWidth: "92vw",
            opacity: 0.06,
            pointerEvents: "none",
          }}
        />
        <div
          className="fade-enter"
          style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 760 }}
        >
          <Eyebrow onDark>An accountability society for principal dentists</Eyebrow>
          <div
            className="display"
            style={{ color: "var(--accent)", marginTop: 24, marginBottom: 8, fontSize: "clamp(72px, 14vw, 168px)" }}
          >
            Kept.
          </div>
          <Body
            lg
            className="muted"
            style={{ maxWidth: 540, margin: "0 auto", color: "var(--fg-muted)" }}
          >
            A goal said aloud to a peer is a goal more often kept. The Club pairs you
            with another principal, holds the appointment, and remembers what was
            promised.
          </Body>
          <div className="row center gap-4" style={{ marginTop: 40, flexWrap: "wrap" }}>
            <Button href="/signup">Request an introduction</Button>
            <Button href="/login" variant="ghost" onDark>
              I am already a member
            </Button>
          </div>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section style={{ background: "var(--bg-paper)", padding: "96px clamp(20px, 5vw, 64px)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Eyebrow>The arrangement</Eyebrow>
          <H2 style={{ maxWidth: 560, marginTop: 12 }}>
            Four steps, then a standing appointment.
          </H2>
          <Divider />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 48,
              marginTop: 16,
            }}
          >
            <Step no="I" title="You are put forward">
              Tell the Club your focus for the season and the cadence you can keep.
            </Step>
            <Step no="II" title="You are matched">
              The Club pairs you with another principal of fitting ambition and hour.
            </Step>
            <Step no="III" title="You meet">
              You sit together over video. The conversation is transcribed and
              rendered into goals you may check off.
            </Step>
            <Step no="IV" title="You are held to it">
              At the next sitting, you review what was kept and set the season ahead.
            </Step>
          </div>
        </div>
      </section>

      {/* ---- What the Club provides ---- */}
      <section style={{ background: "var(--bg-paper-raise)", padding: "96px clamp(20px, 5vw, 64px)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Eyebrow>What is provided</Eyebrow>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 32,
              marginTop: 32,
            }}
          >
            <Provision title="The match">
              A single, considered pairing — not a market of strangers.
            </Provision>
            <Provision title="The room">
              Video sittings within the Club, no third-party invitation required.
            </Provision>
            <Provision title="The record">
              Transcription that becomes a ledger of goals, kept or outstanding.
            </Provision>
            <Provision title="Correspondence">
              A private line to your partner between sittings.
            </Provision>
            <Provision title="The calendar">
              Your appointments held in Google or Outlook, as you prefer.
            </Provision>
            <Provision title="The ledger">
              A history of every season, and everything you said you would do.
            </Provision>
          </div>
        </div>
      </section>

      {/* ---- Closing ---- */}
      <section
        style={{
          background: "var(--tpc-midnight)",
          color: "var(--fg)",
          padding: "120px 24px",
          textAlign: "center",
        }}
      >
        <Eyebrow onDark>Membership opens by introduction</Eyebrow>
        <H2 style={{ color: "var(--fg)", maxWidth: 620, margin: "20px auto 0", fontWeight: 400 }}>
          The work is yours. The keeping of it, we share.
        </H2>
        <div className="row center" style={{ marginTop: 40 }}>
          <Button href="/signup">Request an introduction</Button>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer
        style={{
          background: "var(--tpc-midnight-deep)",
          color: "var(--fg-muted)",
          borderTop: "1px solid var(--rule)",
          padding: "28px clamp(20px, 5vw, 64px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          font: "500 10px/1 var(--font-sans)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        <span>The Principals Club · Est. MMXXVI</span>
        <span style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Link href="/login" style={{ color: "inherit", textDecoration: "none" }}>
            Sign in
          </Link>
          <span>House Rules</span>
          <span>Privacy</span>
        </span>
      </footer>
    </div>
  );
}

function Step({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="mono-sm"
        style={{ color: "var(--tpc-gold-deep)", fontSize: 13, letterSpacing: "0.2em" }}
      >
        No. {no}
      </div>
      <H3 style={{ marginTop: 12 }}>{title}</H3>
      <Body className="muted" style={{ marginTop: 8 }}>
        {children}
      </Body>
    </div>
  );
}

function Provision({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 18 }}>
      <H3 style={{ fontSize: 20 }}>{title}</H3>
      <Caption style={{ marginTop: 8 }}>{children}</Caption>
    </div>
  );
}
