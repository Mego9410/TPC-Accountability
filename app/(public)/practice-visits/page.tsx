import type { Metadata } from "next";
import { Body, Button, Caption, Eyebrow, H3, TextLink } from "@/components/ui";
import { Closing, Faq, LandingSection, SectionHead } from "@/components/landing/furniture";
import { ExclusionZone, Programme, Returns } from "@/components/landing/visits";

export const metadata: Metadata = {
  title: "Companion practice visits",
  description:
    "A morning inside another member's practice, and in turn a morning inside yours. Any member, by mutual agreement, twice a year at most. No consultant, no conference, and nothing to buy at the end of the afternoon.",
};

const RULES = [
  { no: "I", rule: "Nobody hosts a competitor", why: "At least twenty to thirty minutes' drive apart. Journey time, not a fixed radius, so it works in London and in Norfolk alike, and it is on the two of you to hold to it." },
  { no: "II", rule: "Any request may be declined", why: "For any reason, at any time, without explanation. A difficult week is reason enough. Declining is part of the scheme, not a departure from it." },
  { no: "III", rule: "Two visits a year", why: "A ceiling rather than an ambition, with any member and by mutual agreement. It keeps the thing occasional, and keeps hosting from becoming an intrusion on a working business." },
  { no: "IV", rule: "Confidentiality is mutual", why: "Both principals agree the same undertaking before a visit is arranged. What is seen in the building stays in the building." },
  { no: "V", rule: "No patient contact", why: "You are there to see how a practice is run, not its clinical work, unless your host offers otherwise and the consents are in place." },
  { no: "VI", rule: "The visitor sets the agenda", why: "Within whatever the host is willing to show. Nobody arrives with a scorecard, and nobody is being assessed." },
];

const FAQS = [
  { q: "Who arranges it?", a: "You do, between you. You ask any member, or any member asks you, and the date is settled in your correspondence. Nothing is arranged over your head and nobody is paired off by the House." },
  { q: "What does it cost?", a: "Nothing beyond your membership. There is no fee to host and no fee to visit, and nobody is selling anything at four o'clock." },
  { q: "Do I have to open my practice?", a: "In turn, yes. There are no hosts and no visitors here, only principals taking it in turns; you are both. The half usually left unsaid is the better half: opening your practice is not a favour done for the profession, and being asked why you do it like that is worth the morning on its own." },
  { q: "What if the only members near me are local?", a: "Then you look further out. A visit is only ever arranged with a practice at least twenty to thirty minutes' drive away, and the directory covers the whole country, so distance is rarely the obstacle a day out of the diary is." },
  { q: "What if the week is impossible?", a: "Decline it. A visit can be moved or refused without explanation, and doing so is not held against you or recorded anywhere." },
  { q: "How long does it take?", a: "A morning is usual. Some principals stay for lunch and the afternoon; some days run to the surgeries and no further. The programme is indicative, not a timetable you are held to." },
];

export default function VisitsPage() {
  return (
    <>
      <LandingSection tone="midnight">
        <div className="lp-head">
          <Eyebrow onDark>Companion practice visits</Eyebrow>
          <h1 className="h1" style={{ fontSize: "clamp(32px, 4.6vw, 52px)", color: "var(--fg)" }}>
            A morning inside someone else&rsquo;s practice. And, in turn, a morning inside yours.
          </h1>
          <Body lg style={{ color: "var(--fg-muted)" }}>
            With any member, by mutual agreement, twice a year at most. One principal, one practice, one
            honest look around: the workflow, the systems, the processes, and the feel of how someone else
            has built their culture. No consultant. No conference. Nothing to buy at the end of the
            afternoon.
          </Body>
        </div>
        <div className="lp-cta">
          <Button href="/signup">Request an introduction</Button>
          <TextLink href="/tour" className="on-dark">Tour the House</TextLink>
        </div>
      </LandingSection>

      <LandingSection tone="paper" narrow>
        <SectionHead eyebrow="The case for it" title="Twenty years in the same building, and you stop seeing it." />
        <div className="lp-prose" style={{ marginTop: 28 }}>
          <Body>
            Every principal knows their own practice better than anyone alive, and rather less well than a
            stranger would after a morning. That is not a failure of attention; it is what familiarity does.
            The reception script that stopped working four years ago, the surgery nobody wants to be put in,
            the ten minutes that quietly leave every afternoon: all of it is invisible from the inside, in
            the way the hall of your own house is invisible.
          </Body>
          <Body>
            Ownership is also, structurally, a solitary business. There is nobody in the building to ask
            whether staffing is this difficult everywhere, whether the fee increase is brave or merely
            reckless, or whether the way you have always run the recall is the way anyone else runs it.
            Advice is available, at a price, from people with something to sell.
          </Body>
          <Body>
            This is the plain answer to that. A principal spends a morning inside another principal&rsquo;s
            practice and, in turn, opens their own. Nothing is presented and nothing is sold. Two people who
            hold the same job compare how they do it.
          </Body>
        </div>
      </LandingSection>

      <LandingSection tone="baize">
        <SectionHead onDark eyebrow="The day" title="A morning, as it tends to go." />
        <div className="lp-visit-grid">
          <Programme />
          <div className="lp-visit-aside">
            <ExclusionZone />
          </div>
        </div>
      </LandingSection>

      <LandingSection tone="paper" narrow>
        <SectionHead eyebrow="How it is arranged" title="Four steps, and either of you may stop at the second." />
        <ol className="lp-steps" style={{ marginTop: 40 }}>
          <li className="lp-step">
            <span className="lp-step-no" aria-hidden="true">I</span>
            <H3>One of you proposes a morning</H3>
            <Body>Either principal may ask to visit or offer to receive. The proposal carries a date and, usually, a line about what you hope to see.</Body>
          </li>
          <li className="lp-step">
            <span className="lp-step-no" aria-hidden="true">II</span>
            <H3>The other agrees, or declines</H3>
            <Body>Declining takes one click and needs no reason. Agreeing means both of you have given the same confidentiality undertaking, which the Club records.</Body>
          </li>
          <li className="lp-step">
            <span className="lp-step-no" aria-hidden="true">III</span>
            <H3>The host sets the practicalities</H3>
            <Body>Where to park, who to ask for at reception, when the coffee is on. The morning then sits in both diaries until it happens.</Body>
          </li>
          <li className="lp-step">
            <span className="lp-step-no" aria-hidden="true">IV</span>
            <H3>You both write down anything worth remembering</H3>
            <Body>A note against the visit, seen by the two of you and nobody else. Whatever struck the visitor, and whatever the host took from being asked why they do it like that. There is no form and no scoring; a line each is plenty, and an empty note is nobody&rsquo;s business but yours.</Body>
          </li>
        </ol>
      </LandingSection>

      <LandingSection tone="paper">
        <SectionHead
          eyebrow="What it returns"
          title="Four of them, and the better ones belong to whoever opens the door."
          lede="There are no hosts and no visitors. There are only principals, taking it in turns."
        />
        <Returns />
      </LandingSection>

      <LandingSection tone="parchment">
        <SectionHead eyebrow="The terms" title="Written for the person opening the door." lede="Stated once, at the start. They exist to protect the host, and they are not buried." />
        <ul className="lp-rules-list" style={{ marginTop: 36 }}>
          {RULES.map((r) => (
            <li key={r.no} className="lp-rule">
              <span className="lp-step-no" aria-hidden="true">{r.no}</span>
              <span className="lp-rule-text">{r.rule}</span>
              <p className="lp-rule-why">{r.why}</p>
            </li>
          ))}
        </ul>
        <div className="lp-cta">
          <TextLink href="/house-rules">All seven house rules</TextLink>
        </div>
      </LandingSection>

      <LandingSection tone="paper" narrow>
        <SectionHead eyebrow="Questions" title="What principals ask before they agree." />
        <div style={{ marginTop: 28 }}>
          <Faq items={FAQS} />
        </div>
        <div className="lp-cta">
          <Caption>Visits are part of membership, not an extra.</Caption>
          <TextLink href="/membership">What membership includes</TextLink>
        </div>
      </LandingSection>

      <LandingSection tone="parchment" narrow>
        <div className="lp-three">
          <div>
            <H3>Forty years</H3>
            <Body>Frank Taylor &amp; Associates has advised dental principals on value, sale and succession since the firm began.</Body>
          </div>
          <div>
            <H3>Nothing is charged</H3>
            <Body>There is no fee to host and none to visit. Visits come with membership and carry no further obligation.</Body>
          </div>
          <div>
            <H3>No visit without your word</H3>
            <Body>Nothing is arranged over your head. Every visit is agreed between the two principals themselves, and either may decline without a reason.</Body>
          </div>
        </div>
      </LandingSection>

      <Closing eyebrow="Companion practice visits" />
    </>
  );
}
