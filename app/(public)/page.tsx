import type { Metadata } from "next";
import { MenteesSection, MentorsSection } from "@/components/landing/audience";
import { FurnishedExample } from "@/components/landing/example";
import { Closing, MembershipStrip, RulesExcerpt } from "@/components/landing/furniture";
import { Hero } from "@/components/landing/hero";
import { Figures, Pillars } from "@/components/landing/pillars";
import { VisitsSection } from "@/components/landing/visits";

export const metadata: Metadata = {
  title: { absolute: "The Principals Club · An accountability society for principal dentists" },
  description:
    "A goal said aloud to someone who will ask about it is a goal more often kept. Mentors, pods of six, twelve-week blocks, companion practice visits, and a benchmark of the figures you would otherwise never see.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />

      <Pillars />
      <Figures />
      <VisitsSection />
      <FurnishedExample />
      <MenteesSection />
      <MentorsSection />
      <MembershipStrip />
      <RulesExcerpt />
      <Closing />
    </>
  );
}
