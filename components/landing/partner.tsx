import { Body, Button, Caption, H3 } from "@/components/ui";
import { LandingSection, SectionHead } from "./furniture";

/* =========================================================================
   The partner. Half of the Club, and the half that runs all year. Written
   plainly, because the whole point is that there is very little to explain.
   ------------------------------------------------------------------------- */

const MOMENTS = [
  {
    title: "You ask",
    body: "Read the members directory, find a principal whose year looks something like yours, and ask them. They accept or they decline, and a decline needs no reason. One partner at a time; either of you may end it.",
  },
  {
    title: "You share what you are working on",
    body: "Not a plan. The handful of things you are actually trying to do this year, written in a line each. Your partner can see them and write a word against them, and you against theirs.",
  },
  {
    title: "Once a month, a note",
    body: "The Club writes to you both and asks how the other is getting on. Answer it in a sentence or ignore it. That is the whole mechanism, and there is nothing else underneath it.",
  },
];

export function PartnerSection() {
  return (
    <LandingSection id="partner" tone="parchment">
      <SectionHead
        eyebrow="The partner"
        title="Someone who asks how it is going."
        lede="Ownership is a solitary job. There is nobody in the building who can ask whether you did the thing you said you would do in January."
      />

      <div className="lp-prose" style={{ marginTop: 28 }}>
        <Body>
          A partner is one other principal. You find them yourself in the members directory, you ask them,
          and they accept or they decline. Nobody is matched, seated or assigned, and nothing happens over
          your head.
        </Body>
        <Body>
          Between you, you share the few things you are working on. They can see yours and write a word
          against them; you can see theirs and do the same. It is not advice and it is not a review. It is
          one person who knows what you said you would do, and who is close enough to notice when you quietly
          stop doing it.
        </Body>
        <Body>
          Once a month the Club sends you both a note asking how the other is getting on. That is the entire
          arrangement. There are no weeks to keep up with, no score, and nothing to fall behind on.
        </Body>
      </div>

      <div className="lp-three">
        {MOMENTS.map((m) => (
          <div key={m.title}>
            <H3>{m.title}</H3>
            <Body>{m.body}</Body>
          </div>
        ))}
      </div>

      <div className="lp-cta">
        <Button href="/signup" variant="secondary">Request an introduction</Button>
        <Caption>A goal said aloud to someone who will ask about it is a goal more often kept.</Caption>
      </div>
    </LandingSection>
  );
}
