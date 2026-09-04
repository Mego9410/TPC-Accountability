import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/session";
import { Body, Divider, Eyebrow, H1 } from "@/components/ui";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "A few particulars" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const viewer = await requireViewer({ onboarded: false });
  const { profile } = viewer;
  if (profile.onboarded) redirect("/home");
  const { as } = await searchParams;
  const wants = as === "mentor" || profile.role === "mentor" ? "mentor" : as === "peer" ? "peer" : "mentee";

  return (
    <div className="onboarding">
      <header className="onboarding-bar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/monogram-gold.png" alt="The Principals Club" style={{ height: 44 }} />
      </header>

      <div className="onboarding-body fade-enter">
        <Eyebrow>Your introduction</Eyebrow>
        <H1>A few particulars, then a seat.</H1>
        <Body className="muted">
          The House reads these before seating you. Nothing here is shown to other members except your name, your practice and what you are working on.
        </Body>

        <Divider />

        <OnboardingForm profile={profile} wants={wants} />
      </div>
    </div>
  );
}
