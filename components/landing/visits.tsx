import { Body, Button, Caption, Eyebrow, H3, TextLink } from "@/components/ui";
import { LandingSection, SectionHead } from "./furniture";

/* =========================================================================
   Companion practice visits. A morning inside another member's practice, and
   in turn a morning inside yours: any member, by mutual agreement, twice a
   year at most. The scheme is abstract until somebody shows you the day, so
   the day is the hero: the programme, hour by hour, and the one rule that
   decides whether an owner reads on.
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
        <span className="lp-indicative">Roughly</span>
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
        Your host decides what they are happy to show, and you ask for whatever you came to see. Plenty of
        mornings never get past the surgeries.
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
          Concentric rings around your practice mark twenty and thirty minutes of driving. A visit is only
          ever arranged with a practice beyond the outer ring.
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
          <text x="104" y="124" textAnchor="middle">You</text>
        </g>

        {/* The match, beyond the outer ring. */}
        <path d="M190 78 C 220 68, 244 60, 262 56" className="lp-zone-arc" />
        <g className="lp-zone-pin match">
          <text x="276" y="40" textAnchor="middle">A member</text>
          <circle cx="276" cy="54" r="4.5" />
        </g>
      </svg>
      <figcaption>
        Measured in journey time rather than miles, so it holds wherever you are: twenty minutes in London
        covers about three miles, and in Norfolk about twenty. Nobody visits or hosts inside their own
        catchment.
      </figcaption>
    </figure>
  );
}

const TERMS = [
  { term: "You host as well as visit", def: "Anyone who spends a morning in someone else's practice is expected to open their own in return. That is the whole arrangement." },
  { term: "Nobody hosts a competitor", def: "At least twenty to thirty minutes' drive apart. It is measured in journey time rather than miles, which is why it works as well in Norfolk as in London." },
  { term: "Any request may be declined", def: "For any reason, at any time, and you do not have to say why. A busy week is reason enough." },
  { term: "Two visits a year at most", def: "Enough to be useful, few enough that hosting never becomes a drain on a working practice." },
  { term: "No patient contact", def: "You are there to watch how the practice runs. The clinical work is not part of the visit." },
];

/** The visit as a pillar of the Club, on baize. */
export function VisitsSection() {
  return (
    <LandingSection id="visits" tone="baize">
      <SectionHead
        onDark
        eyebrow="Companion practice visits"
        title="A morning inside someone else's practice. And, in turn, a morning inside yours."
        lede="You spend a morning watching another member run their practice: how the day is set, how the diary holds together, how reception talks to patients, how the team works. Then you do the same for them. If you visit someone, you are expected to host in return, and the Club asks for no more than two of these a year."
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

/* ---------- What a visit returns ----------
   Ordered deliberately. The first two are what the visitor learns from the
   host, because that is what the morning is for. The host's own return comes
   third, and the fresh pair of eyes last: it is a happy side effect of having
   someone in the building, not the reason to open the door. */
export const RETURNS = [
  {
    name: "Seeing it done",
    line: "An hour watching someone else's practice run teaches more than a day of being told about it",
    body: "You can read about huddles, treatment coordinators and recall systems for years without knowing what any of them look like on a Tuesday morning. Standing in the corridor while it happens is different. You see how long the huddle really takes, who speaks, what reception says when the phone goes, and how the diary absorbs a cancellation.",
    pull: "Most principals have never watched another practice work. Not once since they qualified.",
  },
  {
    name: "The current answer",
    line: "What is actually working now, from someone who is doing it",
    body: "Scanners and whether they have paid for themselves. Treatment coordinators and what they are really worth. Where the good associates are looking this year and what makes them stay. Your host has a current answer to at least one thing you are guessing about, and they will give it to you in a doorway rather than from a stage.",
    pull: "No invoice follows, because nobody is selling you anything.",
  },
  {
    name: "Showing your own",
    line: "Explaining how you do it is how you find out why you do it",
    body: "Hosting turns out to be the half people underestimate. Walking someone through your morning makes you say out loud things you have never had to put into words, and some of them will not survive the saying. Most hosts find they learn as much from the questions as their visitor learns from the answers.",
    pull: "Nobody has asked you why you do it that way in years. It is a good question.",
  },
  {
    name: "A second pair of eyes",
    line: "And occasionally, something you had stopped noticing",
    body: "Twenty years in the same building and some things go invisible: the surgery nobody wants to be put in, the script that stopped working four years ago. A visitor sometimes mentions one of them. Take it or leave it — nobody arrives to audit your practice, and anything they notice is a bonus rather than the purpose.",
    pull: "Mentioned over lunch, if at all. You will not be handed a report.",
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
      <Button href="/signup">Request an introduction</Button>
      <TextLink href="/membership">What membership includes</TextLink>
    </div>
  );
}
