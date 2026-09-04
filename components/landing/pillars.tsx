import type { ReactNode } from "react";
import { Body, H3 } from "@/components/ui";
import { LandingSection, SectionHead } from "./furniture";

/* =========================================================================
   The four objects the Club is made of. Each carries a small drawn mark so
   the row reads as a set of things rather than four paragraphs.
   ------------------------------------------------------------------------- */

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg className="lp-mark" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {children}
    </svg>
  );
}

const PILLARS = [
  {
    title: "The circle",
    body: "A mentor and a mentee, sitting fortnightly. Or a pod of six led by a mentor, sitting monthly. Small on purpose: nobody can hide in a room of six.",
    mark: (
      <Mark>
        <circle cx="24" cy="24" r="17" />
        <circle cx="24" cy="11" r="3.4" />
        <circle cx="35.3" cy="30.5" r="3.4" />
        <circle cx="12.7" cy="30.5" r="3.4" />
      </Mark>
    ),
  },
  {
    title: "The block",
    body: "Twelve weeks. One outcome, written down, and under it the one or two things you will do each week, set at a sitting and asked about at the next.",
    mark: (
      <Mark>
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`${r}-${c}`} x={7 + c * 12} y={8 + r * 8.5} width="9" height="5.5" opacity={r * 3 + c < 5 ? 1 : 0.32} />
          )),
        )}
      </Mark>
    ),
  },
  {
    title: "The visit",
    body: "A morning inside another principal's practice, and in turn a morning inside yours. The systems, the diary, the team. Everyone in the circle, in turn.",
    mark: (
      <Mark>
        <path d="M6 26 L15 18 L24 26" />
        <path d="M9 26 V38 H21 V26" />
        <path d="M24 22 L33 14 L42 22" />
        <path d="M27 22 V38 H39 V22" />
        <path d="M15 33 H33" strokeDasharray="2 3" />
      </Mark>
    ),
  },
  {
    title: "The record",
    body: "Check-ins, wins, and a benchmark of the figures you would otherwise never see. Kept for as long as the Club stands, and never quietly deleted.",
    mark: (
      <Mark>
        <path d="M11 8 H33 A4 4 0 0 1 37 12 V40 H15 A4 4 0 0 1 11 36 Z" />
        <path d="M18 17 H30M18 24 H30M18 31 H26" />
      </Mark>
    ),
  },
];

export function Pillars() {
  return (
    <LandingSection tone="paper">
      <SectionHead eyebrow="What the Club is" title="A circle, a block, a visit, and a record." />
      <div className="lp-pillars">
        {PILLARS.map((p) => (
          <article key={p.title}>
            {p.mark}
            <H3>{p.title}</H3>
            <Body>{p.body}</Body>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}

/* ---------- A quiet strip of the four figures that decide it ---------- */
const FIGURES = [
  { n: "6", label: "to a pod", sub: "Led by a mentor" },
  { n: "12", label: "week blocks", sub: "One outcome each" },
  { n: "2", label: "visits a year", sub: "A ceiling, not a target" },
  { n: "£0", label: "for mentors", sub: "The place is given" },
];

export function Figures() {
  return (
    <section className="lp-figures" aria-label="The Club in four figures">
      <div className="lp-container">
        <dl>
          {FIGURES.map((f) => (
            <div key={f.label}>
              <dt>
                <span className="lp-fig-n">{f.n}</span>
                <span className="lp-fig-label">{f.label}</span>
              </dt>
              <dd>{f.sub}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
