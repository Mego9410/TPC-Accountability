import type { Metadata } from "next";
import { Closing, MembershipStrip, RulesExcerpt, SectionHead, Steps, LandingSection } from "@/components/landing/furniture";
import { Hero } from "@/components/landing/hero";
import { PartnerSection } from "@/components/landing/partner";
import { Figures, Pillars } from "@/components/landing/pillars";
import { VisitsSection } from "@/components/landing/visits";

export const metadata: Metadata = {
  title: { absolute: "The Principals Club · An accountability club for principal dentists" },
  description:
    "A goal said aloud to someone who will ask about it is a goal more often kept. One partner, found and asked by you, and a morning inside each other's practices twice a year.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />

      <Pillars />
      <Figures />
      <PartnerSection />
      <VisitsSection />

      <LandingSection tone="paper">
        <SectionHead
          eyebrow="How it works"
          title="Four steps, and the last two are the whole of it."
          lede="There is nothing to learn and nothing to keep up with. You join, you ask someone, you say what you are working on, and twice a year you open the door."
        />
        <Steps />
      </LandingSection>

      <MembershipStrip />
      <RulesExcerpt />
      <Closing />
    </>
  );
}
