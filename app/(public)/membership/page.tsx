import type { Metadata } from "next";
import { Body, Button, Caption, Card, Eyebrow, H2, H3 } from "@/components/ui";
import { Closing, LandingSection, SectionHead } from "@/components/landing/furniture";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "One kind of member, admitted by introduction. A partner, two companion practice visits a year, the members directory and correspondence. Terms are being settled with the founding members.",
};

export default function MembershipPage() {
  return (
    <>
      <LandingSection tone="paper">
        <SectionHead
          eyebrow="Membership"
          title="One kind of member, and one way in."
          lede="There are no tiers, no upgrades and nobody ranked above anybody. Every principal in the Club has the same two things and gives the same undertakings."
        />

        <div className="lp-pair">
          <Card as="article">
            <Eyebrow>What membership includes</Eyebrow>
            <ul>
              <li>A partner: one other principal, found by you and asked by you</li>
              <li>The monthly note, asking you both how the other is getting on</li>
              <li>Two companion practice visits a year, with any member who agrees</li>
              <li>The members directory, so you can see who to ask and who is open to being asked</li>
              <li>Correspondence with your partner, with a host, and with the House</li>
            </ul>
            <div className="lp-pair-foot">
              <Button href="/signup" variant="secondary">Request an introduction</Button>
            </div>
          </Card>

          <Card as="article" emphasis>
            <Eyebrow>What membership asks of you</Eyebrow>
            <ul>
              <li>Turn up. Answer the monthly note, even when the answer is that nothing has moved</li>
              <li>Be honest. A tidy account of a bad quarter helps nobody, least of all you</li>
              <li>Host when you are asked, or decline freely. Both are proper answers</li>
              <li>Keep what you see inside somebody else&rsquo;s building inside it</li>
              <li>Say so when you are done, rather than going quiet</li>
            </ul>
            <div className="lp-pair-foot">
              <Button href="/tour">Tour the House</Button>
            </div>
          </Card>
        </div>
      </LandingSection>

      <LandingSection tone="parchment" narrow>
        <div className="lp-doc">
          <div className="lp-doc-section">
            <H2>What it costs</H2>
            <Body>
              Nothing is stated yet, and this page will not pretend otherwise. Terms and pricing are being
              settled with the founding members, who are joining now and whose view of what this is worth
              will decide it. When it is settled it will be written here plainly, in one figure, and
              existing members will be told before anyone else.
            </Body>
          </div>

          <div className="lp-doc-section">
            <H2>What &ldquo;by introduction&rdquo; means</H2>
            <Body>
              There is no open door. You request an introduction, which is a sign-up the House reads before
              anything happens. The House may write back with a question or two: what you run, how long you
              have run it, and what you want the next year to do. Then you are admitted, or you are told,
              plainly, why not yet.
            </Body>
            <Body>
              The reason is the room. The whole thing rests on principals being willing to ask each other
              awkward questions and to open their buildings to one another. An introduction is how the House
              keeps that true. It is not a test of standing and it has never been about who you know.
            </Body>
          </div>

          <div className="lp-doc-section">
            <H2>Finding a partner is your job, not the House&rsquo;s</H2>
            <Body>
              Nobody is matched or seated. You read the directory, you choose a principal whose year looks
              something like yours, and you ask. They accept or they decline, and a decline needs no reason
              and is not recorded against anyone. One partner at a time, and either of you may end it and
              ask somebody else.
            </Body>
          </div>

          <div className="lp-doc-section">
            <H2>Leaving</H2>
            <Body>
              Leaving is a message to the House. Your partner is told that the partnership has ended, and
              nothing further. Your particulars are removed within thirty days, and what you wrote down is
              either sent to you or deleted, as you ask.
            </Body>
          </div>

          <Card>
            <H3>See it before you ask.</H3>
            <Caption>The tour is the whole House, furnished, as a member, as a partner, or as the House itself. Nothing you do in it is saved anywhere but your own browser.</Caption>
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
