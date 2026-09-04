import type { Metadata } from "next";
import { Button, Eyebrow } from "@/components/ui";
import { MenteesSection, MentorsSection, WhatTheClubIs } from "@/components/landing/audience";
import { FurnishedExample } from "@/components/landing/example";
import { Closing, MembershipStrip, RulesExcerpt } from "@/components/landing/furniture";

export const metadata: Metadata = {
  title: { absolute: "The Principals Club · An accountability society for principal dentists" },
  description:
    "A goal said aloud to someone who will ask about it is a goal more often kept. Mentors, pods of six, twelve-week blocks, a weekly check-in, and a benchmark of the figures you would otherwise never see.",
};

export default function LandingPage() {
  return (
    <>
      <section className="lp-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lp-hero-mark" src="/brand/monogram-gold.png" alt="" />
        <div className="lp-hero-inner fade-enter">
          <Eyebrow onDark>An accountability society for principal dentists</Eyebrow>
          <h1 className="lp-kept">Kept.</h1>
          <p className="lp-thesis">A goal said aloud to someone who will ask about it is a goal more often kept.</p>

          <div className="lp-doors">
            <a href="#mentees" className="lp-door">
              <Eyebrow onDark>For mentees</Eyebrow>
              <span className="lp-door-title">I run a practice and want this year to go differently.</span>
              <span className="lp-door-detail">A mentor who has done it, a pod of six at your stage, and a record of what you kept.</span>
              <span className="lp-door-go textlink on-dark">Read on</span>
            </a>
            <a href="#mentors" className="lp-door">
              <Eyebrow onDark>For mentors</Eyebrow>
              <span className="lp-door-title">I have done it and want to give a year back.</span>
              <span className="lp-door-detail">An hour a fortnight with one or two principals, a pod to lead, and a circle of your own.</span>
              <span className="lp-door-go textlink on-dark">Read on</span>
            </a>
          </div>

          <div className="lp-quiet">
            <Button href="/login" variant="ghost" onDark>Sign in</Button>
            <Button href="/tour" variant="ghost" onDark>Tour the House</Button>
          </div>
        </div>
      </section>

      <WhatTheClubIs />
      <FurnishedExample />
      <MenteesSection />
      <MentorsSection />
      <MembershipStrip />
      <RulesExcerpt />
      <Closing />
    </>
  );
}
