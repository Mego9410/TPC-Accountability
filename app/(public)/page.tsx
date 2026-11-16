import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/landing/chrome";
import { Distance } from "@/components/landing/distance";
import { FreshEyes } from "@/components/landing/fresh-eyes";
import { Hero } from "@/components/landing/hero";
import { Membership } from "@/components/landing/letter";
import { Morning } from "@/components/landing/morning";
import { Pillars } from "@/components/landing/panels";
import { PartnerSection } from "@/components/landing/partner";
import { HouseRules } from "@/components/landing/rules";
import { Closing, HowItWorks, Marquee, PullQuote, Thesis } from "@/components/landing/sections";
import { HomeShell } from "@/components/landing/shell";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "The Principals Club · An accountability club for principal dentists" },
  description:
    "A goal said aloud to someone who will ask about it is a goal more often kept. One partner, found and asked by you, and a morning inside each other's practices twice a year.",
};

/* =========================================================================
   The home page.

   Ten sections, and no two next to each other are the same shape: a
   photographic hero, a statement, two opening panels, a running strip, a
   working demonstration, a draggable filmstrip, a full-bleed quote, a
   comparison, a diagram, a sticky list, a letter, a register and a close.
   Grounds alternate ink, cream, parchment, midnight and bone — the real
   tonal jumps, not the 1.06:1 one the old page relied on.
   ------------------------------------------------------------------------- */

export default async function LandingPage() {
  const viewer = await getViewer();
  const signedIn = viewer !== null;

  return (
    <HomeShell>
      <SiteHeader signedIn={signedIn} />
      <Hero />
      <Thesis />
      <Pillars />
      <Marquee />
      <PartnerSection />
      <Morning />
      <PullQuote />
      <FreshEyes />
      <Distance />
      <HowItWorks />
      <Membership />
      <HouseRules />
      <Closing signedIn={signedIn} />
      <SiteFooter signedIn={signedIn} />
    </HomeShell>
  );
}
