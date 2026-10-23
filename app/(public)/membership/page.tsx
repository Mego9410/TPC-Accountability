import type { Metadata } from "next";
import { Body, Button, Caption, Card, Eyebrow, H2, H3 } from "@/components/ui";
import { Closing, LandingSection, SectionHead } from "@/components/landing/furniture";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "One kind of member, admitted by introduction. A partner, two companion visits a year, the members directory and correspondence. Terms are being settled with the founding members.",
};

export default function MembershipPage() {
  return (
    <>
      <LandingSection tone="paper">
        <SectionHead
          eyebrow="Membership"
          title="One kind of member, and one way in."
          lede="There are no tiers or upgrades. Every principal in the Club has the same two things and gives the same undertakings."
        />

        <div className="lp-pair">
          <Card as="article">
            <Eyebrow>What membership includes</Eyebrow>
            <ul>
              <li>A partner: one other principal, whom you find and ask yourself</li>
              <li>The monthly note, asking you both how the other is getting on</li>
              <li>Two companion visits a year, with any member who agrees</li>
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
              <li>Answer the monthly note, even when the answer is that nothing has moved</li>
              <li>Be honest about a bad quarter instead of tidying it up</li>
              <li>If you spend a morning in another member&rsquo;s practice, host them for one in return. Any single request can be declined, with no reason needed</li>
              <li>Keep what you see inside somebody else&rsquo;s building inside it</li>
              <li>Say so when you have had enough, rather than going quiet</li>
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
              We have not set a price yet. Terms and pricing are being settled with the founding members,
              who are joining now. Once they are agreed we will write the figure on this page, and tell
              existing members before anyone else.
            </Body>
          </div>

          <div className="lp-doc-section">
            <H2>What &ldquo;by introduction&rdquo; means</H2>
            <Body>
              You request an introduction, which is a sign-up the House reads before anything happens. The
              House may write back with a question or two: what you run, how long you have run it, and what
              you would like to change this year. You are then admitted, or told why not yet.
            </Body>
            <Body>
              The Club only works if principals are willing to ask each other awkward questions and to open
              their practices to one another, so the House would rather read an introduction than leave the
              door open to anyone. It is not a test of standing, and who you know makes no difference.
            </Body>
          </div>

          <div className="lp-doc-section">
            <H2>You find your own partner</H2>
            <Body>
              The House does not match anybody. You read the members directory, choose a principal whose
              year looks something like yours, and ask them. They accept or decline, and a decline needs no
              reason and is not recorded against anyone. One partner at a time, and either of you can end
              it and ask somebody else.
            </Body>
          </div>

          <div className="lp-doc-section">
            <H2>Leaving</H2>
            <Body>
              To leave, write to the House. Your partner is told that the partnership has ended, and nothing
              further. Your particulars are removed within thirty days, and what you wrote down is either
              sent to you or deleted, as you ask.
            </Body>
          </div>

          <Card>
            <H3>See it before you ask.</H3>
            <Caption>The tour is the whole Club, furnished with invented principals. Look round as a member, as a partner or as the House. Nothing you do in it is saved anywhere but your own browser.</Caption>
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
