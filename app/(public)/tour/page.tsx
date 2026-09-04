import type { Metadata } from "next";
import { Body, Button, Caption, Eyebrow, H1, Notice } from "@/components/ui";
import { env } from "@/lib/env";
import { LandingSection } from "@/components/landing/furniture";

export const metadata: Metadata = {
  title: "Tour the House",
  description: "Walk through the furnished example as a member, a mentor, or the House. Nothing you do in the tour is saved anywhere but your own browser.",
};

const SEATS = [
  {
    as: "member",
    eyebrow: "As a member",
    title: "Dr Jordan Cheng",
    detail: "Three years a principal at Cheng Dental, Marylebone. In week five of a twelve-week turnover block, mentored by Dr Adesanya, and one of the Marylebone Six.",
    go: "Sit as Dr Cheng",
  },
  {
    as: "mentor",
    eyebrow: "As a mentor",
    title: "Dr Amara Adesanya",
    detail: "Fourteen years a principal in Leeds. Mentor to two, lead of the Marylebone Six, and running a block of her own on opening a second site.",
    go: "Sit as Dr Adesanya",
  },
  {
    as: "house",
    eyebrow: "As the House",
    title: "The House",
    detail: "The staff who seat members, form circles, and see the Club whole: who has checked in, who is waiting for a seat, and which pair needs a word.",
    go: "Open the House",
  },
];

export default function TourPage() {
  return (
    <LandingSection tone="paper">
      <div className="lp-head">
        <Eyebrow>The furnished example</Eyebrow>
        <H1>Tour the House.</H1>
        <Body lg className="muted">
          The whole Club, furnished with a small world of principals so that every page looks lived in. Choose a seat. You can change seats at any time from the bar at the top, and see what you did in one seat from another.
        </Body>
      </div>

      {env.previewEnabled ? (
        <div className="lp-tour-doors">
          {SEATS.map((s) => (
            <a key={s.as} href={`/api/tour?as=${s.as}`} className="choice-body">
              <Eyebrow>{s.eyebrow}</Eyebrow>
              <span className="choice-title">{s.title}</span>
              <span className="choice-detail">{s.detail}</span>
              <span className="textlink">{s.go}</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="lp-cta">
          <Notice>The tour is closed at present. Members may sign in; anyone else may request an introduction.</Notice>
          <Button href="/login" variant="secondary" size="sm">Sign in</Button>
        </div>
      )}

      <div className="lp-cta">
        <Caption>Nothing you do in the tour is saved anywhere but your own browser.</Caption>
      </div>
    </LandingSection>
  );
}
