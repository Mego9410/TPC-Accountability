import type { Metadata } from "next";
import { Body, Caption, Eyebrow, H1, H2, TextLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "House rules",
  description: "The seven rules of The Principals Club, each with the reason behind it.",
};

const RULES = [
  { no: "I", rule: "One partner at a time.", why: "A partner is one other principal rather than a group. With two or three it becomes nobody's job to answer, and the arrangement stops being light enough to keep up." },
  { no: "II", rule: "A partner is there to ask questions.", why: "A question is usually more use than advice nobody asked for. Nothing you share is scored or ranked, and none of it is held against you." },
  { no: "III", rule: "Any request may be declined, and no reason is owed.", why: "A partnership, a visit or a proposed date can all be refused, at any time, and a difficult week is reason enough. Declining is expected and is not recorded against you." },
  { no: "IV", rule: "Nobody hosts a competitor.", why: "At least twenty to thirty minutes' drive apart. We use journey time rather than distance, so the rule means the same in London and in Norfolk. It is on the two of you to hold to it." },
  { no: "V", rule: "Two visits a year.", why: "Two is the limit and most members will do fewer, which keeps hosting from becoming a burden on a working practice. If you spend a morning in another member's practice, you are expected to host them for a morning in return." },
  { no: "VI", rule: "No patient contact.", why: "You are there to learn how your host runs the day: their systems, their team, the shape of a morning. Clinical work is not part of it unless your host offers and the consents are in place." },
  { no: "VII", rule: "What is seen in the building stays in it.", why: "Both principals give the same undertaking before a visit is arranged, and it does not lapse when the morning ends. The same holds for anything a partner tells you." },
];

export default function HouseRulesPage() {
  return (
    <article className="tpc-page prose lp-doc fade-enter">
      <div className="lp-doc-head">
        <Eyebrow>The Principals Club</Eyebrow>
        <H1>House rules.</H1>
        <Body lg className="muted">
          Seven rules, each with its reason. They are short, and they apply to every member and to the House.
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
          Tell the House. A first breach usually means a conversation: the House will hear both sides and put it right where it can, rather than removing anybody. The seventh rule is the exception, since there is no putting back what has been repeated outside the building, and breaking it can end a membership.
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
