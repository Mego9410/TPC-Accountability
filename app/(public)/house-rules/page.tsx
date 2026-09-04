import type { Metadata } from "next";
import { Body, Caption, Eyebrow, H1, H2, TextLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "House rules",
  description: "The eight rules of The Principals Club, each with the reason for it. Short, and meant to be read.",
};

const RULES = [
  { no: "I", rule: "What is said in a sitting stays in it.", why: "A mentor's notes are seen by the mentee they are about, and by nobody else. The pod hears the pod." },
  { no: "II", rule: "A missed commitment is recorded, not judged.", why: "The record exists so that you can see the pattern, not so that anyone can hold it against you." },
  { no: "III", rule: "Numbers are shared anonymously or not at all.", why: "The benchmark shows medians across cohorts of five or more. Nobody sees another member's figures, the House included." },
  { no: "IV", rule: "A sitting is kept, or it is moved. It is not skipped.", why: "A standing hour is the whole point. Move it when you must, and say so before, not after." },
  { no: "V", rule: "Mentors ask. They advise only when asked.", why: "A question does more than an answer and lasts longer. Advice given unasked is mostly about the giver." },
  { no: "VI", rule: "One outcome a block.", why: "Twelve weeks is long enough for one thing to change and short enough that you cannot put it off. Two outcomes is none." },
  { no: "VII", rule: "The check-in is honest, or it is not made.", why: "Four questions, four minutes. A check-in written to look well is worse than none, because it is read." },
  { no: "VIII", rule: "Nobody is paid and nobody pays to mentor.", why: "A mentor's place is given. The moment there is a fee either way, it is a different arrangement and not this one." },
];

export default function HouseRulesPage() {
  return (
    <article className="tpc-page prose lp-doc fade-enter">
      <div className="lp-doc-head">
        <Eyebrow>The Principals Club</Eyebrow>
        <H1>House rules.</H1>
        <Body lg className="muted">
          Eight rules, each with its reason. They are short so that they are read, and they are few so that they are kept. Every member, mentor and member of the House holds to them.
        </Body>
      </div>

      <ol className="lp-rules-list" aria-label="The eight house rules">
        {RULES.map((r) => (
          <li key={r.no} className="lp-rule">
            <span className="lp-step-no" aria-hidden="true">{r.no}</span>
            <span className="lp-rule-text">{r.rule}</span>
            <p className="lp-rule-why">{r.why}</p>
          </li>
        ))}
      </ol>

      <div className="lp-doc-section">
        <H2>When a rule is broken</H2>
        <Body>
          Tell the House. A first breach is a conversation; the House will hear both sides and, where it can, re-seat rather than remove. A breach of the first or third rule, which concern what is private, is the one thing the House will not re-seat around.
        </Body>
        <Caption>Last revised September 2026.</Caption>
      </div>

      <div className="row gap-5 wrap">
        <TextLink href="/privacy">Privacy</TextLink>
        <TextLink href="/membership">Membership</TextLink>
        <TextLink href="/" back>The Club</TextLink>
      </div>
    </article>
  );
}
