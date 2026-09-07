import type { Metadata } from "next";
import { Body, Caption, Eyebrow, H1, H2, TextLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the Club records about you, who can see it, how long it is kept, and how to leave.",
};

export default function PrivacyPage() {
  return (
    <article className="tpc-page prose lp-doc fade-enter">
      <div className="lp-doc-head">
        <Eyebrow>The Principals Club</Eyebrow>
        <H1>Privacy.</H1>
        <Body lg className="muted">
          The Club keeps very little: what you are working on, what was written against it, and the mornings you spent in one another&rsquo;s practices. This page says what is kept, who can read it, and how you take it with you.
        </Body>
      </div>

      <div className="lp-doc-section">
        <H2>What is collected</H2>
        <Body>Five kinds of thing, and nothing else.</Body>
        <ul>
          <li><b>Your particulars.</b> Your name and honorific, your email address, your practice&rsquo;s name, region, type and chair count, how long you have been a principal, your time zone, a short note about yourself, what you are working on, and whether you are open to a partner or to a visitor. All of it comes from you, at onboarding and in your settings.</li>
          <li><b>Your goals.</b> The handful of things you have said you are working on: a title, whatever detail you choose to add, an optional date, and whether you have marked it done.</li>
          <li><b>The updates written against them.</b> The lines you write about your own goals, and the lines your partner writes about them. Every one of them is shown to both of you as it is written; there is nothing written about you that you cannot read.</li>
          <li><b>Your visits.</b> Who visited whom, the practice, the date, where it stands, the arrival note, and whatever the two of you wrote down afterwards.</li>
          <li><b>Your correspondence.</b> Messages between you and another member, and between you and the House.</li>
        </ul>
        <Body>
          The Club keeps no scores, no streaks and no figures from your practice. There is nothing to report each month and no number you are asked for.
        </Body>
      </div>

      <div className="lp-doc-section">
        <H2>Who sees what</H2>
        <ul>
          <li><b>Your partner</b> sees your particulars, the goals you have shared, and every update written against them, including their own. Nothing is hidden from them and nothing is hidden from you.</li>
          <li><b>Any member</b> sees what is in the members directory: your name, your practice, your region, how long you have been a principal, your note about yourself, what you are working on in general terms, and whether you are open to a partner or a visitor. Your goals and your updates are not in the directory.</li>
          <li><b>A host or a visitor</b> sees the arrangements for the morning you have agreed, and whatever either of you writes down afterwards. Nobody else sees a visit note.</li>
          <li><b>The House</b>, meaning the small staff who admit members and answer correspondence, sees your particulars, whether you have a partner, and your visits. The House does not read the updates written against your goals unless you ask it to look at something.</li>
          <li><b>You</b> see all of it, as it is written.</li>
        </ul>
      </div>

      <div className="lp-doc-section">
        <H2>How long it is kept</H2>
        <Body>
          For as long as you are a member, all of it. When a partnership ends, what was written against your goals stays yours to read and is no longer shown to the person you were partnered with. If you leave the Club, your particulars are removed within thirty days and everything else is either given to you or deleted, as you ask. A visit note written by another member about a morning in your practice is theirs as well as yours, and is kept unless you both ask for it to go.
        </Body>
      </div>

      <div className="lp-doc-section">
        <H2>The tour</H2>
        <Body>
          The furnished example on this site is held entirely in your own browser, in a cookie. The principals in it are invented. Nothing you do in the tour reaches a server, is seen by the House, or can be recovered by anyone but you, and leaving the tour clears it.
        </Body>
      </div>

      <div className="lp-doc-section">
        <H2>How to leave</H2>
        <Body>
          To end a partnership, do it in your settings and your partner is told that it has ended, and nothing further. To leave the Club, write to the House. To have what you wrote sent to you before it is deleted, say so in the same message. There is no form and no notice period.
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
