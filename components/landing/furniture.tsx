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
  { no: "I", title: "You join", text: "Request an introduction. The House reads it, asks you a question or two, and writes back within the week." },
  { no: "II", title: "You find a partner", text: "Read the members directory, choose a principal whose year looks something like yours, and ask them. They accept, or they decline without a reason." },
  { no: "III", title: "You share what you are working on", text: "The few things you are actually trying to do this year. Your partner can see them and write a word against them, and you against theirs." },
  { no: "IV", title: "You visit each other", text: "A morning inside their practice, seeing how they run the day, and in turn a morning inside yours. Any member, by mutual agreement, twice a year at most." },
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
      <SectionHead
        eyebrow="Membership"
        title="One kind of member, admitted by introduction."
        lede="There are no tiers or upgrades. Every member has the same two things."
      />
      <div className="lp-pair">
        <Card as="article">
          <Eyebrow>What it includes</Eyebrow>
          <ul>
            <li>A partner, once you find one and they agree</li>
            <li>Two companion visits a year, with any member</li>
            <li>The members directory, so you can see who to ask</li>
            <li>Correspondence with your partner and with the House</li>
          </ul>
        </Card>
        <Card as="article" emphasis>
          <Eyebrow>What it asks</Eyebrow>
          <ul>
            <li>Answer the monthly note</li>
            <li>Be honest about what has not moved</li>
            <li>Host a morning in return if you spend one in another member&rsquo;s practice</li>
            <li>Keep what you see in someone else&rsquo;s building inside it</li>
          </ul>
          <Caption>Terms and pricing are being settled with the founding members.</Caption>
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
  { rule: "A partner is there to ask questions.", why: "A question is usually more use than advice nobody asked for. Nothing you share is scored or ranked, and none of it is held against you." },
  { rule: "Any request may be declined, without a reason.", why: "A partnership, a visit or a proposed date can all be refused. Declining is expected and is not recorded against you." },
  { rule: "What is seen in the building stays in it.", why: "Both principals give the same undertaking before a visit is arranged, and it does not lapse afterwards." },
];

export function RulesExcerpt() {
  return (
    <LandingSection tone="paper">
      <SectionHead eyebrow="House rules" title="Three of the seven." />
      <div className="lp-three">
        {THREE_RULES.map((r) => (
          <div key={r.rule}>
            <H3>{r.rule}</H3>
            <Body>{r.why}</Body>
          </div>
        ))}
      </div>
      <div className="lp-cta">
        <TextLink href="/house-rules">All seven rules</TextLink>
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
        <H2>A partner, and two mornings a year.</H2>
        <div className="lp-cta">
          <Button href="/signup">Request an introduction</Button>
          <Button href="/tour" variant="secondary" onDark>Tour the House</Button>
        </div>
      </div>
    </LandingSection>
  );
}
