import type { ReactNode } from "react";
import { Body, H3 } from "@/components/ui";
import { LandingSection, SectionHead } from "./furniture";

/* =========================================================================
   The two things the Club is made of. Each carries a small drawn mark so the
   row reads as a pair of objects rather than two paragraphs.
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
    title: "The partner",
    body: "One other principal, picked out of the members directory and asked by you. You each write down the handful of things you are working on, and either of you can add a line against the other's. Once a month we email you both to ask how they are getting on. There is nothing to score and nothing to keep up with.",
    /* Two principals, level with one another, and the line of enquiry between them. */
    mark: (
      <Mark>
        <circle cx="15" cy="16" r="5" />
        <path d="M6 38 A9 9 0 0 1 24 38" />
        <circle cx="33" cy="16" r="5" />
        <path d="M24 38 A9 9 0 0 1 42 38" />
        <path d="M20 26 H28" strokeDasharray="2 3" />
      </Mark>
    ),
  },
  {
    title: "The visit",
    body: "A morning watching another member run their practice: how they set the day, what reception says to patients, how the diary copes. Then they spend a morning in yours. Everyone does both, with any member they agree it with, and no more than twice a year.",
    /* Two doorways, and the crossing between them. */
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
];

export function Pillars() {
  return (
    <LandingSection tone="paper">
      <SectionHead
        eyebrow="What the Club is"
        title="A partner, and a morning in each other's practices."
        lede="Two things. You will not find a programme, a scoring system or a set of weekly targets anywhere in it."
      />
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

/* ---------- A quiet strip of the three figures that decide it ---------- */
const FIGURES = [
  { n: "1", label: "partner", sub: "One at a time, and you choose them" },
  { n: "2", label: "visits a year", sub: "At most, and you host as well as go" },
  { n: "0", label: "scores", sub: "Nothing is ranked or counted" },
];

export function Figures() {
  return (
    <section className="lp-figures" aria-label="The Club in three figures">
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
