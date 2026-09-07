import type { Metadata } from "next";
import { Body, Caption, Eyebrow, H1, H2, TextLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "House rules",
  description: "The seven rules of The Principals Club, each with the reason for it. Short, and meant to be read.",
};

const RULES = [
  { no: "I", rule: "One partner at a time.", why: "A partner is one other principal, not a panel. Two at once is nobody's, and it is the reason the arrangement stays light enough to keep." },
  { no: "II", rule: "A partner is there to ask, not to judge.", why: "A question does more than an answer and lasts longer. Nothing you share is scored, ranked or held against you, and advice given unasked is mostly about the giver." },
  { no: "III", rule: "Any request may be declined, and no reason is owed.", why: "A partnership, a visit, a date: all of them may be refused, at any time. A difficult week is reason enough. Declining is part of the scheme, not a departure from it." },
  { no: "IV", rule: "Nobody hosts a competitor.", why: "At least twenty to thirty minutes' drive apart. Journey time, not a radius, so it means the same in London and in Norfolk, and it is on the two of you to hold to it." },
  { no: "V", rule: "Two visits a year.", why: "A ceiling rather than an ambition. It keeps the thing occasional and keeps hosting from becoming an intrusion on a working business." },
  { no: "VI", rule: "No patient contact.", why: "You are there to see how a practice is run, not its clinical work, unless your host offers otherwise and the consents are in place." },
  { no: "VII", rule: "What is seen in the building stays in it.", why: "Both principals give the same undertaking before a visit is arranged, and it does not lapse when the morning ends. The same holds for anything a partner tells you." },
];

export default function HouseRulesPage() {
  return (
    <article className="tpc-page prose lp-doc fade-enter">
      <div className="lp-doc-head">
        <Eyebrow>The Principals Club</Eyebrow>
        <H1>House rules.</H1>
        <Body lg className="muted">
          Seven rules, each with its reason. They are short so that they are read, and they are few so that they are kept. Every member, and every member of the House, holds to them.
        </Body>
      </div>

      <ol className="lp-rules-list" aria-label="The seven house rules">
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
          Tell the House. A first breach is a conversation; the House will hear both sides and, where it can, put it right rather than remove anybody. A breach of the seventh rule, which is the one that concerns what is private, is the thing the House will not work around.
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
