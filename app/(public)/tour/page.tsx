import type { Metadata } from "next";
import { Body, Button, Caption, Eyebrow, H1, Notice } from "@/components/ui";
import { env } from "@/lib/env";
import { LandingSection } from "@/components/landing/furniture";

export const metadata: Metadata = {
  title: "Tour the House",
  description: "Walk through the furnished example as a member, as a partner, or as the House. Nothing you do in the tour is saved anywhere but your own browser.",
};

const SEATS = [
  {
    as: "member",
    eyebrow: "As a member",
    title: "Dr Jordan Cheng",
    detail: "Three years a principal at Cheng Dental, Marylebone. Partnered with Dr Adesanya, a morning in the diary, and a request from another principal waiting to be answered.",
    go: "Sit as Dr Cheng",
  },
  {
    as: "partner",
    eyebrow: "As a partner",
    title: "Dr Amara Adesanya",
    detail: "Fourteen years a principal in Leeds, six chairs and a second site half open. Jordan's partner, and coming to Marylebone next month.",
    go: "Sit as Dr Adesanya",
  },
  {
    as: "house",
    eyebrow: "As the House",
    title: "The House",
    detail: "The small staff who read the introductions and answer the correspondence, and who see the Club whole: who has been admitted, who is still looking for a partner, and which mornings are in the diary.",
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
          The whole Club, furnished with a small world of invented principals so that every page looks lived in. Choose a seat. You can change seats at any time from the bar at the top, and see from one seat what you did in another.
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
