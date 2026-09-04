import { Body, Button, Caption, Eyebrow, H3, TextLink } from "@/components/ui";
import { LandingSection, SectionHead } from "./furniture";

/* =========================================================================
   Companion practice visits. Every principal spends a morning inside another
   principal's practice, and in turn opens their own. The scheme is abstract
   until somebody shows you the day, so the day is the hero: the programme,
   hour by hour, and the one rule that decides whether an owner reads on.
   ------------------------------------------------------------------------- */

const PROGRAMME = [
  { at: "8.40", what: "Arrive", detail: "Coffee in the staff room before the first patient is through the door." },
  { at: "9.00", what: "The huddle", detail: "How the day gets set, who says what, and how long it actually takes." },
  { at: "9.30", what: "The surgeries", detail: "Layout, kit, what they bought, and what they wish they had not." },
  { at: "11.00", what: "The diary", detail: "Where the gaps are, who fills them, and what happens to a failed appointment." },
  { at: "12.15", what: "Reception", detail: "The conversation that turns an enquiry into a booking, heard first hand." },
  { at: "1.00", what: "Lunch", detail: "The questions you actually came to ask." },
];

export function Programme() {
  return (
    <div className="lp-programme">
      <div className="lp-programme-head">
        <Eyebrow onDark>A morning, as it tends to go</Eyebrow>
        <span className="lp-indicative">Indicative</span>
      </div>
      <ol className="lp-hours">
        {PROGRAMME.map((row) => (
          <li key={row.at}>
            <span className="lp-hour">{row.at}</span>
            <span className="lp-hour-what">{row.what}</span>
            <span className="lp-hour-detail">{row.detail}</span>
          </li>
        ))}
      </ol>
      <p className="lp-programme-foot">
        The visitor sets the agenda, within whatever the host is willing to show. Some days run to the
        surgeries and no further.
      </p>
    </div>
  );
}

/** The exclusion zone, drawn. One rule, and it decides whether an owner reads on. */
export function ExclusionZone() {
  return (
    <figure className="lp-zone">
      <svg viewBox="0 0 330 212" role="img" aria-labelledby="zone-title zone-desc">
        <title id="zone-title">The exclusion zone, measured in drive time</title>
        <desc id="zone-desc">
          Concentric rings around your practice mark twenty and thirty minutes of driving. A match is only
          ever offered beyond the outer ring.
        </desc>

        {/* Rings. The core is left empty so the practice can be named inside it. */}
        <circle cx="104" cy="102" r="84" className="lp-zone-ring outer" />
        <circle cx="104" cy="102" r="52" className="lp-zone-ring" />

        {/* Ring labels, set below each ring where nothing else runs. */}
        <text x="104" y="168" className="lp-zone-label" textAnchor="middle">20 min</text>
        <text x="104" y="200" className="lp-zone-label" textAnchor="middle">30 min</text>

        {/* Your practice, named inside the empty core. */}
        <g className="lp-zone-pin">
          <circle cx="104" cy="102" r="4.5" />
          <text x="104" y="126" textAnchor="middle">Your practice</text>
        </g>

        {/* The match, beyond the outer ring. */}
        <path d="M190 78 C 220 68, 244 60, 262 56" className="lp-zone-arc" />
        <g className="lp-zone-pin match">
          <text x="276" y="40" textAnchor="middle">A match</text>
          <circle cx="276" cy="54" r="4.5" />
        </g>
      </svg>
      <figcaption>
        Journey time, not mileage. Twenty minutes in London is three miles; twenty minutes in Norfolk is
        twenty. Nobody is ever offered a practice inside their own catchment.
      </figcaption>
    </figure>
  );
}

const TERMS = [
  { term: "Nobody hosts a competitor", def: "Twenty to thirty minutes' drive time, at least. Journey time, not a radius." },
  { term: "Any request may be declined", def: "For any reason, at any time, without explanation. A difficult week is reason enough." },
  { term: "Two visits a year", def: "A ceiling rather than an ambition. It keeps hosting from becoming an intrusion on a working business." },
  { term: "No patient contact", def: "You are there to see how a practice is run, not its clinical work." },
];

/** The visit as a pillar of the Club, on baize. */
export function VisitsSection() {
  return (
    <LandingSection id="visits" tone="baize">
      <SectionHead
        onDark
        eyebrow="Companion practice visits"
        title="A morning inside someone else's practice. And, in turn, a morning inside yours."
        lede="Every principal in a circle visits every other. One principal, one practice, one honest look around: the systems, the diary, the team, the decisions. No consultant, and nothing to buy at the end of the afternoon."
      />

      <div className="lp-visit-grid">
        <Programme />
        <div className="lp-visit-aside">
          <ExclusionZone />
        </div>
      </div>

      <ul className="lp-terms">
        {TERMS.map((t) => (
          <li key={t.term}>
            <span className="lp-term-name">{t.term}</span>
            <span className="lp-term-def">{t.def}</span>
          </li>
        ))}
      </ul>

      <div className="lp-cta">
        <Button href="/practice-visits" variant="secondary" onDark>How a visit works</Button>
        <Caption>Twenty years in the same building, and you stop seeing it.</Caption>
      </div>
    </LandingSection>
  );
}

/* ---------- What a visit returns: used in full on /visits ---------- */
export const RETURNS = [
  {
    name: "The blind spot",
    line: "Fresh eyes on a practice you stopped seeing years ago",
    body: "A visitor arrives with no history, no loyalty to the way it has always been done, and one question they cannot help asking: why do you do it like that? Some of the time there is a good answer. The rest of the time is the point.",
    pull: "No invoice follows. Nobody is selling you a system at four o'clock.",
  },
  {
    name: "The rehearsal",
    line: "The walkthrough a buyer will one day do, years before it counts",
    body: "Every practice that changes hands is eventually walked round by a stranger looking for what is wrong with it: the reliance on one clinician, the systems that live only in the principal's head, the undocumented processes that quietly move the price.",
    pull: "The first person to walk your practice and ask why should not be the person buying it.",
  },
  {
    name: "The catch-up",
    line: "What has changed since you last had to learn it",
    body: "Scanners and their actual return. Treatment coordinators, and whether they earn their salary. Private conversion. Where the good associates are genuinely looking, and what makes them stay. Every visitor carries the current answer to something.",
    pull: "Handed over in a surgery doorway rather than from a stage.",
  },
  {
    name: "The pipeline",
    line: "The next generation, in your building, before they are your buyer",
    body: "Whoever eventually buys your practice, partners in it, or turns out to be the best hire you ever made is at present working in somebody else's. This puts you in front of that room years early, in the one setting where character is actually visible.",
    pull: "What you know took thirty years to learn, and at present it leaves the profession when you do.",
  },
];

export function Returns() {
  return (
    <div className="lp-returns">
      {RETURNS.map((r) => (
        <article key={r.name}>
          <Eyebrow>{r.name}</Eyebrow>
          <H3>{r.line}</H3>
          <Body>{r.body}</Body>
          <p className="lp-pull">{r.pull}</p>
        </article>
      ))}
    </div>
  );
}

export function VisitsCta() {
  return (
    <div className="lp-cta">
      <Button href="/signup?as=mentee">Request an introduction</Button>
      <TextLink href="/membership">What membership costs</TextLink>
    </div>
  );
}
