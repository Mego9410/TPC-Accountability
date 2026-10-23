import type { Metadata } from "next";
import { Body, Button, Caption, Eyebrow, H3, TextLink } from "@/components/ui";
import { Closing, Faq, LandingSection, SectionHead } from "@/components/landing/furniture";
import { ExclusionZone, Programme, Returns } from "@/components/landing/visits";
import { FoundingHost } from "@/components/landing/founding-host";

export const metadata: Metadata = {
  title: "Companion practice visits",
  description:
    "A morning watching another member run their practice, and in turn a morning inside yours. Any member, by agreement, twice a year at most. If you visit, you host in return.",
};

const RULES = [
  { no: "I", rule: "If you visit, you host", why: "A visit goes both ways. Anyone who spends a morning in another member's practice is expected to open their own when asked, and the Club will say so plainly before you arrange the first one." },
  { no: "II", rule: "Nobody hosts a competitor", why: "At least twenty to thirty minutes' drive apart, measured in journey time rather than miles, so it holds wherever you practise." },
  { no: "III", rule: "Any request may be declined", why: "For any reason, at any time, and you do not have to give one. A busy week is reason enough, and declining is not held against you." },
  { no: "IV", rule: "Two visits a year at most", why: "Enough to be worth doing, few enough that hosting never becomes a drain on a working practice." },
  { no: "V", rule: "Confidentiality is mutual", why: "Both of you agree the same undertaking before anything is arranged. What you see in someone's building stays there." },
  { no: "VI", rule: "No patient contact", why: "You are there to watch how the practice runs. Clinical work is outside the visit unless your host offers otherwise and the consents are in place." },
  { no: "VII", rule: "Your host decides what to show", why: "You say what you hoped to see and they show you what they are comfortable showing. Nobody arrives with a checklist and nobody is being marked." },
];

const FAQS = [
  { q: "Who arranges it?", a: "You do, between the two of you. You ask any member, or they ask you, and you settle the date in your correspondence. Nobody is paired off by the House and nothing is arranged over your head." },
  { q: "What does it cost?", a: "Nothing beyond your membership. There is no fee to host and none to visit." },
  { q: "Do I have to open my practice?", a: "Yes, in turn. That is the deal, and it is worth being plain about it before you ask anyone: everybody here is both visitor and host. Most people are more nervous about hosting than visiting and then find they get more out of it, because explaining your own morning to someone who has never seen it is a useful exercise in itself." },
  { q: "What if everyone near me is a competitor?", a: "Then you look further afield. Visits are only arranged with practices at least twenty to thirty minutes away, and the directory covers the whole country. In practice the harder part is finding the morning, not finding the practice." },
  { q: "What if the week turns out to be impossible?", a: "Move it or decline it. Either is fine, you do not have to explain, and neither is recorded anywhere or held against you." },
  { q: "How long does it take?", a: "A morning, usually. Some people stay for lunch and into the afternoon, and plenty of visits never get past the surgeries. The running order below is a rough guide rather than a timetable." },
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
            You spend a morning watching another member run their practice, and then you do the same for
            them. Any member, by agreement between the two of you, and no more than twice a year. If you
            visit, you are expected to host in return.
          </Body>
        </div>
        <div className="lp-cta">
          <Button href="/signup">Request an introduction</Button>
          <TextLink href="/tour" className="on-dark">Tour the House</TextLink>
        </div>
      </LandingSection>

      <LandingSection tone="paper" narrow>
        <SectionHead eyebrow="The case for it" title="Most principals have never watched another practice work." />
        <div className="lp-prose" style={{ marginTop: 28 }}>
          <Body>
            You trained in somebody else&rsquo;s surgery and you have worked in your own ever since. Between
            those two things, almost nobody gets to stand in a colleague&rsquo;s practice on an ordinary
            Tuesday and watch how it actually runs: how the morning is set, who says what at the huddle,
            what reception does with an enquiry, how the diary takes a cancellation on the chin.
          </Body>
          <Body>
            That is what a companion visit is. Your host shows you how they do it, which is a far easier
            thing to ask of someone than an inspection, and a far more useful morning than a course. You
            will come away with two or three things you want to try, and a clear view of one or two you
            are glad you do differently.
          </Body>
          <Body>
            Then you open your own doors and do the same for them. Hosting is the half people are nervous
            about and end up valuing most: explaining your morning to someone who has never seen it makes
            you say out loud why you do things the way you do, and some of those answers do not survive
            being said. If your visitor happens to spot something you had stopped noticing, take it. But
            nobody arrives to pick holes in your practice, and you are not being assessed.
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
        <SectionHead eyebrow="How it is arranged" title="Four steps, and either of you can stop it at the second." />
        <ol className="lp-steps" style={{ marginTop: 40 }}>
          <li className="lp-step">
            <span className="lp-step-no" aria-hidden="true">I</span>
            <H3>One of you proposes a morning</H3>
            <Body>You can ask to visit someone, or offer to have them come to you. Put a date on it and a line about what you are hoping to see. Both of you know from the outset that a visit one way means a visit back.</Body>
          </li>
          <li className="lp-step">
            <span className="lp-step-no" aria-hidden="true">II</span>
            <H3>The other agrees, or declines</H3>
            <Body>Declining takes one click and needs no reason. If they agree, you have both given the same confidentiality undertaking and the Club keeps a record of it.</Body>
          </li>
          <li className="lp-step">
            <span className="lp-step-no" aria-hidden="true">III</span>
            <H3>The host sets the practicalities</H3>
            <Body>Where to park, who to ask for at reception, what time the coffee is on. After that it sits in both diaries until the day comes.</Body>
          </li>
          <li className="lp-step">
            <span className="lp-step-no" aria-hidden="true">IV</span>
            <H3>You both write down anything worth remembering</H3>
            <Body>There is a shared note against the visit that only the two of you can see. Use it for the handful of things you want to try, or for the question your visitor asked that you could not answer. A line each is plenty, and leaving it empty is nobody&rsquo;s business but yours.</Body>
          </li>
        </ol>
      </LandingSection>

      <LandingSection tone="paper">
        <SectionHead
          eyebrow="What it returns"
          title="What you get out of a morning, going and hosting."
          lede="Everyone does both, so every member sees it from each side within a year or so."
        />
        <Returns />
      </LandingSection>

      <LandingSection tone="parchment">
        <SectionHead eyebrow="The terms" title="Written for the person opening the door." lede="These are set out at the start rather than buried, because they are what make hosting safe to agree to." />
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
          <Caption>Visits come with membership; there is nothing extra to buy.</Caption>
          <TextLink href="/membership">What membership includes</TextLink>
        </div>
      </LandingSection>

      <FoundingHost />

      <LandingSection tone="parchment" narrow>
        <div className="lp-three">
          <div>
            <H3>Forty years</H3>
            <Body>Frank Taylor &amp; Associates has advised dental principals on value, sale and succession since the firm began.</Body>
          </div>
          <div>
            <H3>Nothing is charged</H3>
            <Body>There is no fee to host and none to visit. Visits come with membership, and the only thing you owe is a morning back.</Body>
          </div>
          <div>
            <H3>No visit without your word</H3>
            <Body>Every visit is agreed between the two of you. Either can decline, without giving a reason.</Body>
          </div>
        </div>
      </LandingSection>

      <Closing eyebrow="Companion practice visits" />
    </>
  );
}
