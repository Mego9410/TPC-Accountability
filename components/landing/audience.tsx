import { Body, Button, Caption, Eyebrow, H3 } from "@/components/ui";
import { LandingSection, SectionHead, Steps } from "./furniture";

/* =========================================================================
   The two audiences. Each section is used whole on the landing page and, with
   `full`, at greater length on its own page.
   ------------------------------------------------------------------------- */

const MENTEE_GETS = [
  { term: "A mentor", def: "An experienced principal, seated with you by the House for the history you need. You sit together fortnightly, over video, for an hour." },
  { term: "A pod of six", def: "Principals at a similar stage, led by a mentor, sitting monthly. The place for the question you would not put to a stranger." },
  { term: "Twelve-week blocks", def: "One outcome, with weekly commitments beneath it. Begin from a template written by principals who have done the thing, or from a blank page." },
  { term: "A weekly check-in", def: "Four questions. What went well, what did not, what is next, and how you are. It takes four minutes, and your mentor reads it." },
  { term: "The benchmark", def: "Five figures a month, set against practices like yours. Medians only, cohorts of five or more, and nobody sees yours." },
  { term: "The win log", def: "The things that went right, kept where you will find them on the days that did not." },
  { term: "A morning in their practice", def: "You spend a morning inside each principal's practice in your circle, and they spend one inside yours. Two a year, and never a competitor." },
];

export function MenteesSection({ full }: { full?: boolean }) {
  return (
    <LandingSection id="mentees" tone="paper">
      <SectionHead eyebrow="For mentees" title="You bought the practice. Nobody handed you the manual." />
      <div className="lp-split">
        <div className="lp-prose">
          <Body>
            The first five years as a principal are not what the associate years suggested. You bought a practice and found you had bought a payroll, a lease, a CQC registration and a queue of people who need a decision from you before ten. The dentistry is the easy part. It is also the only part you were trained for.
          </Body>
          <Body>
            None of this is a failure of will. It is what happens when the only person who asks how the practice is going is you, and you are busy. The Club exists to make one other person ask, on a fixed day, and to write the answer down.
          </Body>
          {full && (
            <Body>
              A mentee is not a student. You will not be taught. You will be asked, every fortnight, what you said you would do and whether you did it, by someone who ran a practice through the years you are in now and remembers them clearly.
            </Body>
          )}
        </div>
        <div className="lp-split-aside">
          <Eyebrow>What you get</Eyebrow>
          <ul className="lp-list">
            {MENTEE_GETS.map((g) => (
              <li key={g.term}>
                <span className="lp-term">{g.term}</span>
                <p className="lp-def">{g.def}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lp-sequence">
        <Eyebrow>How it goes</Eyebrow>
        <Steps />
      </div>

      <div className="lp-cta">
        <Button href="/signup?as=mentee">Request an introduction</Button>
        <Caption>An introduction is a sign-up the House reads before you are seated.</Caption>
      </div>
    </LandingSection>
  );
}

const MENTOR_ASKS = [
  { term: "An hour a fortnight", def: "The same slot, the same day, for a year. Sittings move when they must, but they are not skipped." },
  { term: "Honesty", def: "Including about your own mistakes. Your mentee has already heard how it ought to be done; what they have not heard is how it actually went." },
  { term: "No advice unless asked", def: "A question does more than an answer, and lasts longer. The best mentors here say very little and ask a great deal." },
];

const MENTOR_GETS = [
  { term: "A circle of peers", def: "The other mentors, who sit quarterly among themselves and are having the same conversations you are." },
  { term: "Your own block and benchmark", def: "Fourteen years in, there is still a number you are not looking at. Mentors are in the Society without charge." },
  { term: "The record", def: "Two years from now you will be able to see, week by week, what your mentee did with the year you gave." },
];

export function MentorsSection({ full }: { full?: boolean }) {
  return (
    <LandingSection id="mentors" tone="parchment">
      <SectionHead eyebrow="For mentors" title="You have done the hard years. Give one back." />
      <div className="lp-split">
        <div className="lp-prose">
          <Body>
            Mentoring at the Club is not a course and not a consultancy. It is a fortnightly hour with one or two principals earlier on the road than you, and a monthly evening leading a pod of six. You read their check-ins. You leave notes on their commitments. You ask the question they have been avoiding.
          </Body>
          <Body>
            Nobody is paid and nobody pays. A mentor&rsquo;s place in the Club is given, not sold, and it comes with the Society: your own block, your own benchmark, and the record of your own year.
          </Body>
          <Body>
            The House seats you with principals whose focus matches your history. If you opened a second site, you will sit with someone trying to. And in the course of a year you will spend a morning in their practice, and they in yours.
          </Body>
          {full && (
            <Body>
              Most mentors here say the same thing after the first block: that they learned as much as they gave, and that being asked to explain what they did made them understand it for the first time. That is the year back.
            </Body>
          )}
        </div>
        <div className="lp-split-aside">
          <Eyebrow>What it asks</Eyebrow>
          <ul className="lp-list">
            {MENTOR_ASKS.map((g) => (
              <li key={g.term}>
                <span className="lp-term">{g.term}</span>
                <p className="lp-def">{g.def}</p>
              </li>
            ))}
          </ul>
          <Eyebrow style={{ marginTop: 24 }}>What mentors get</Eyebrow>
          <ul className="lp-list">
            {MENTOR_GETS.map((g) => (
              <li key={g.term}>
                <span className="lp-term">{g.term}</span>
                <p className="lp-def">{g.def}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lp-cta">
        <Button href="/signup?as=mentor">Offer to mentor</Button>
        <Caption>The House will ask about your years as a principal before seating you.</Caption>
      </div>
    </LandingSection>
  );
}

/** Kept for the audience pages, where a shorter statement of the Club is wanted. */
export function WhatTheClubIs() {
  return (
    <LandingSection tone="paper">
      <SectionHead eyebrow="What the Club is" title="A circle, a block, and a record." />
      <div className="lp-three">
        <div>
          <H3>The circle</H3>
          <Body>A mentor and a mentee, sitting fortnightly. Or a pod of six led by a mentor, sitting monthly. Small on purpose: nobody can hide in a room of six.</Body>
        </div>
        <div>
          <H3>The block</H3>
          <Body>Twelve weeks. One outcome, written down. Under it, the one or two things you will do each week, set at a sitting and asked about at the next.</Body>
        </div>
        <div>
          <H3>The record</H3>
          <Body>Check-ins, wins, and a benchmark of the figures you would otherwise never see. Kept for as long as the Club stands, and never quietly deleted.</Body>
        </div>
      </div>
    </LandingSection>
  );
}
