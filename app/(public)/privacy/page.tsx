import type { Metadata } from "next";
import { Body, Caption, Eyebrow, H1, H2, TextLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the Club records about you, how the benchmark is made anonymous, who can see what, how long it is kept, and how to leave.",
};

export default function PrivacyPage() {
  return (
    <article className="tpc-page prose lp-doc fade-enter">
      <div className="lp-doc-head">
        <Eyebrow>The Principals Club</Eyebrow>
        <H1>Privacy.</H1>
        <Body lg className="muted">
          The Club keeps a record of what you said you would do and whether you did it. That is the product. This page says what is in the record, who can read it, and how you take it with you.
        </Body>
      </div>

      <div className="lp-doc-section">
        <H2>What is collected</H2>
        <Body>Four kinds of thing, and nothing else.</Body>
        <ul>
          <li><b>Your particulars.</b> Your name and honorific, your email address, your practice&rsquo;s name, region, type and chair count, how long you have been a principal, your time zone, a short note about yourself, what you are working on, and when you can sit. All of it comes from you, at onboarding and in your settings.</li>
          <li><b>Your commitments.</b> Every block you begin, every commitment beneath it, and what became of each: kept, partly kept, missed, or carried. The sitting it was set at, if it was set at one.</li>
          <li><b>Your check-ins.</b> The four weekly answers and the energy figure, with the week they belong to. Your wins, and the sittings you attended, are kept alongside.</li>
          <li><b>Your benchmark figures.</b> The monthly numbers you choose to report: turnover, hygiene share, treatment plan acceptance, new patients, chair utilisation. Only the ones you enter. None is required.</li>
        </ul>
        <Body>
          The Club does not record your sittings. Video is not stored and there is no transcription. What is kept from a sitting is the note the person who arranged it chooses to write afterwards.
        </Body>
      </div>

      <div className="lp-doc-section">
        <H2>How the benchmark is anonymised</H2>
        <Body>
          A benchmark figure is compared against a cohort: practices of the same type in the same region, or, where that group is too small, the Club as a whole. A cohort is only ever shown when it holds at least five practices. Below five, you see nothing, not a smaller band.
        </Body>
        <Body>
          What you see of a cohort is its median and its middle half, the twenty-fifth to the seventy-fifth percentile. No individual figure is ever shown, no cohort is ever listed by name, and no member, mentor or member of the House can look up another member&rsquo;s numbers. Your own figures are shown to you and stored against your record; they are not part of any page anyone else can open.
        </Body>
      </div>

      <div className="lp-doc-section">
        <H2>Who sees what</H2>
        <ul>
          <li><b>Your mentor</b> sees your particulars, your block and its commitments, your check-ins, your wins, and the notes they have written about you. They do not see your benchmark figures.</li>
          <li><b>Your pod</b> sees your name and practice, your check-ins and your wins. Pods do not see each other&rsquo;s commitments, notes or figures.</li>
          <li><b>The House</b>, meaning the small staff who seat members and form circles, sees your particulars, your circles, your sittings and whether you have checked in this week. The House can see that a block exists and how it is going, so that it can help when a pair is struggling. The House does not see benchmark figures.</li>
          <li><b>You</b> see all of it. Notes your mentor writes about you are shown to you as they are written; there are no notes you cannot read.</li>
        </ul>
        <Body>
          Challenges have a leaderboard. You may take part without appearing on it; if you opt out, your progress is counted in the totals and your name is not shown.
        </Body>
      </div>

      <div className="lp-doc-section">
        <H2>How long it is kept</H2>
        <Body>
          For as long as you are a member, all of it. If you leave the Society but remain a Member, your blocks, check-ins, wins and figures are kept and are still yours to read. If you leave the Club, your particulars are removed within thirty days and your record is either given to you or deleted, as you ask. Benchmark figures that have already been folded into a cohort median cannot be unfolded, but they are not attributable to you once you are gone.
        </Body>
      </div>

      <div className="lp-doc-section">
        <H2>The tour</H2>
        <Body>
          The furnished example on this site is held entirely in your own browser, in a cookie. Nothing you do in the tour reaches a server, is seen by the House, or can be recovered by anyone but you. Leaving the tour clears it.
        </Body>
      </div>

      <div className="lp-doc-section">
        <H2>How to leave</H2>
        <Body>
          To leave the Society, use the membership section of your settings; it takes effect at the end of the month. To leave the Club, write to the House. To have your record sent to you before it is deleted, say so in the same message. There is no form, no notice period and no fee.
        </Body>
        <Caption>Questions about any of this go to the House. Last revised September 2026.</Caption>
      </div>

      <div className="row gap-5 wrap">
        <TextLink href="/house-rules">House rules</TextLink>
        <a className="textlink" href="mailto:house@principalsclub.co.uk">Write to the House</a>
        <TextLink href="/" back>The Club</TextLink>
      </div>
    </article>
  );
}
