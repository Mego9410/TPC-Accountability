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
    body: "The handful of things you are actually trying to do this year, written in a line each. Your partner can see them and write a word against them, and you against theirs.",
  },
  {
    title: "Once a month, a note",
    body: "The Club writes to you both and asks how the other is getting on. Answer it in a sentence, or leave it. There is nothing else to keep up with.",
  },
];

export function PartnerSection() {
  return (
    <LandingSection id="partner" tone="parchment">
      <SectionHead
        eyebrow="The partner"
        title="Someone who asks how it is going."
        lede="Most principals have nobody in the building who can ask whether they did the thing they said they would do in January. A partner is one other principal who will."
      />

      <div className="lp-prose" style={{ marginTop: 28 }}>
        <Body>
          A partner is one other principal. You find them yourself in the members directory, you ask them,
          and they accept or they decline. Nobody is matched or assigned by the House.
        </Body>
        <Body>
          Between you, you share the few things you are working on. They can see yours and write a word
          against them; you can see theirs and do the same. Your partner is not there to give advice. They
          know what you said you would do, and are close enough to notice if you stop doing it.
        </Body>
        <Body>
          Once a month the Club sends you both a note asking how the other is getting on. That is the whole
          arrangement: no weekly check-ins, no score and nothing to fall behind on.
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
        <Caption>One partner at a time, and either of you can end it and ask somebody else.</Caption>
      </div>
    </LandingSection>
  );
}
