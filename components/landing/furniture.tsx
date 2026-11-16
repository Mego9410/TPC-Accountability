import type { ReactNode } from "react";
import { Body, Button, Eyebrow, H2, cn } from "@/components/ui";

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
