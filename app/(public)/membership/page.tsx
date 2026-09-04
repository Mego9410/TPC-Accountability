import type { Metadata } from "next";
import { Body, Button, Caption, Card, Eyebrow, H2, H3 } from "@/components/ui";
import { Closing, LandingSection, SectionHead } from "@/components/landing/furniture";

export const metadata: Metadata = {
  title: "Membership",
  description: "Two tiers. A Member, by introduction and without charge, has a circle, sittings and correspondence. The Society, at £95 a month, adds the record: blocks, the check-in, wins, the benchmark and challenges. Mentors pay nothing.",
};

export default function MembershipPage() {
  return (
    <>
      <LandingSection tone="paper">
        <SectionHead
          eyebrow="Membership"
          title="Two ways to belong, and one way in."
          lede="Every principal in the Club is a Member first, and every Member came in by introduction. The Society is what you add when you want the year written down."
        />

        <div className="lp-tiers">
          <Card as="article" className="lp-tier">
            <Eyebrow>Member</Eyebrow>
            <div className="lp-price">By introduction</div>
            <Body>No monthly charge. A Member is seated in a circle and expected to sit.</Body>
            <ul>
              <li>A circle: a mentor to sit with fortnightly, or a pod of six sitting monthly, often both</li>
              <li>Sittings held in the Club over video, with the notes from each kept against the next</li>
              <li>Correspondence with your circle between sittings</li>
              <li>The calendar, so a sitting is never a surprise</li>
            </ul>
            <div className="lp-tier-foot">
              <Button href="/signup?as=mentee" variant="secondary">Request an introduction</Button>
            </div>
          </Card>

          <Card as="article" className="lp-tier" emphasis>
            <Eyebrow>Society</Eyebrow>
            <div className="lp-price">£95<small>a month</small></div>
            <Body>Everything a Member has, and the record on top. Leave whenever you like; the record stays yours.</Body>
            <ul>
              <li>Twelve-week blocks, begun from a template written by principals or from a blank page</li>
              <li>The weekly check-in: four questions, four minutes, read by your mentor</li>
              <li>The win log, kept across every block you have run</li>
              <li>The benchmark: five figures a month against a cohort of practices like yours</li>
              <li>Club challenges, with a leaderboard you may opt out of and still take part</li>
              <li>A twelve-week review at the end of every block, printable, to take to your accountant or your mentor</li>
            </ul>
            <div className="lp-tier-foot">
              <Button href="/signup?as=mentee">Request an introduction</Button>
            </div>
          </Card>
        </div>
      </LandingSection>

      <LandingSection tone="parchment" narrow>
        <div className="lp-doc">
          <div className="lp-doc-section">
            <H2>What &ldquo;by introduction&rdquo; means</H2>
            <Body>
              There is no open door. You request an introduction, which is a sign-up the House reads before anything happens. The House may write back with a question or two: what you run, how long you have run it, what you want the next year to do. Then you are seated, or you are told, plainly, why not yet.
            </Body>
            <Body>
              The reason is the room. A pod of six only works if the six are principals at a similar stage who have chosen to be asked hard questions. An introduction is how the House keeps that true. It is not a test of standing and it has never been about who you know.
            </Body>
          </div>

          <div className="lp-doc-section">
            <H2>Mentors pay nothing</H2>
            <Body>
              A mentor&rsquo;s place in the Club is given, not sold. Mentors are Members and are in the Society without charge for as long as they mentor: their own block, their own check-in, their own benchmark. Nobody is paid to mentor and nobody pays to be mentored. The exchange is the year.
            </Body>
          </div>

          <div className="lp-doc-section">
            <H2>Leaving</H2>
            <Body>
              Leaving the Society is a single action in your settings and takes effect at the end of the month you are in. Leaving the Club is a message to the House. In either case your record, which is to say every block, check-in and win, remains yours to read and to take.
            </Body>
          </div>

          <Card>
            <H3>See it before you ask.</H3>
            <Caption>The tour is the whole House, furnished, as a member, a mentor, or the House itself. Nothing you do in it is saved anywhere but your own browser.</Caption>
            <div className="row gap-4 wrap">
              <Button href="/tour" variant="secondary" size="sm">Tour the House</Button>
              <Button href="/signup" variant="ghost">Request an introduction</Button>
            </div>
          </Card>
        </div>
      </LandingSection>

      <Closing eyebrow="Membership" />
    </>
  );
}
