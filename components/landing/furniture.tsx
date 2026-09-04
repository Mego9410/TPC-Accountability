import type { ReactNode } from "react";
import { Body, Button, Caption, Card, Eyebrow, H2, H3, TextLink, cn } from "@/components/ui";

/* =========================================================================
   Page furniture for the public side: a full-bleed section, a heading group,
   the I–IV sequence, an FAQ list, the membership strip, the house-rules
   excerpt and the closing. Layout lives in app/(public)/public.css.
   ------------------------------------------------------------------------- */

export function LandingSection({
  id, tone = "paper", narrow, children, className,
}: { id?: string; tone?: "paper" | "parchment" | "midnight" | "baize"; narrow?: boolean; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("lp-section", tone, className)}>
      <div className={cn("lp-container", narrow && "narrow")}>{children}</div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, lede, onDark }: { eyebrow: ReactNode; title: ReactNode; lede?: ReactNode; onDark?: boolean }) {
  return (
    <div className="lp-head">
      <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>
      <H2>{title}</H2>
      {lede && <Body lg>{lede}</Body>}
    </div>
  );
}

/* ---------- The one real sequence ---------- */
const STEPS = [
  { no: "I", title: "You are put forward", text: "Request an introduction. The House reads it, asks you a question or two, and writes back within the week." },
  { no: "II", title: "You are seated", text: "The House seats you with a mentor whose history fits your focus, and in a pod of principals at your stage." },
  { no: "III", title: "You sit", text: "A standing hour every fortnight, over video. You set the block and this fortnight's commitments out loud." },
  { no: "IV", title: "You are held to it", text: "At the next sitting you say what was kept and what was not. It is written down. Then you set the next fortnight." },
];

export function Steps() {
  return (
    <ol className="lp-steps" aria-label="How it goes">
      {STEPS.map((s) => (
        <li key={s.no} className="lp-step">
          <span className="lp-step-no" aria-hidden="true">{s.no}</span>
          <H3>{s.title}</H3>
          <Body>{s.text}</Body>
        </li>
      ))}
    </ol>
  );
}

/* ---------- FAQ ---------- */
export function Faq({ items }: { items: Array<{ q: string; a: string }> }) {
  return (
    <div className="lp-faq">
      {items.map((item) => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <Body>{item.a}</Body>
        </details>
      ))}
    </div>
  );
}

/* ---------- Membership strip ---------- */
export function MembershipStrip() {
  return (
    <LandingSection id="membership" tone="parchment">
      <SectionHead eyebrow="Membership" title="Two ways to belong." lede="Every principal is a Member first. The Society is the record on top." />
      <div className="lp-tiers">
        <Card as="article" className="lp-tier">
          <Eyebrow>Member</Eyebrow>
          <div className="lp-price">By introduction</div>
          <ul>
            <li>A circle: your mentor, or your pod of six</li>
            <li>Sittings, held in the Club over video</li>
            <li>Correspondence with your circle between sittings</li>
          </ul>
          <Caption>Admission is by introduction and there is no monthly charge. The House reads every request.</Caption>
        </Card>
        <Card as="article" className="lp-tier" emphasis>
          <Eyebrow>Society</Eyebrow>
          <div className="lp-price">£95<small>a month</small></div>
          <ul>
            <li>Everything a Member has</li>
            <li>Twelve-week blocks, from a template or a blank page</li>
            <li>The weekly check-in, read by your mentor</li>
            <li>The win log and the benchmark</li>
            <li>Club challenges, with a leaderboard you may opt out of</li>
          </ul>
          <Caption>Mentors are in the Society without charge, for as long as they mentor.</Caption>
        </Card>
      </div>
      <div className="lp-cta">
        <TextLink href="/membership">Membership in full</TextLink>
      </div>
    </LandingSection>
  );
}

/* ---------- House rules excerpt ---------- */
const THREE_RULES = [
  { rule: "What is said in a sitting stays in it.", why: "A mentor's notes are seen by the mentee they are about, and nobody else." },
  { rule: "A missed commitment is recorded, not judged.", why: "The record is there so you can see the pattern, not so anyone can hold it against you." },
  { rule: "Numbers are shared anonymously or not at all.", why: "The benchmark shows medians across cohorts of five or more. Nobody sees your figures." },
];

export function RulesExcerpt() {
  return (
    <LandingSection tone="paper">
      <SectionHead eyebrow="House rules" title="Three of the eight." />
      <div className="lp-three">
        {THREE_RULES.map((r) => (
          <div key={r.rule}>
            <H3>{r.rule}</H3>
            <Body>{r.why}</Body>
          </div>
        ))}
      </div>
      <div className="lp-cta">
        <TextLink href="/house-rules">All eight rules</TextLink>
      </div>
    </LandingSection>
  );
}

/* ---------- Closing ---------- */
export function Closing({ eyebrow = "The Principals Club" }: { eyebrow?: string }) {
  return (
    <LandingSection tone="midnight">
      <div className="lp-closing">
        <Eyebrow onDark>{eyebrow}</Eyebrow>
        <H2>The work is yours. The keeping of it, we share.</H2>
        <div className="lp-cta">
          <Button href="/signup?as=mentee">Request an introduction</Button>
          <Button href="/signup?as=mentor" variant="secondary" onDark>Offer to mentor</Button>
        </div>
      </div>
    </LandingSection>
  );
}
