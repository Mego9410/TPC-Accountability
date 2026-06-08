import type { Metadata } from "next";
import { requireUserProfile } from "@/lib/auth";
import { Body, Divider, Eyebrow, H1, Button } from "@/components/ui";
import { ProfileSetupForm } from "@/components/accountability/profile-setup-form";

export const metadata: Metadata = { title: "Your practice profile" };

/**
 * Step 1.4 — practice profile setup. Pre-fills from the saved profile on
 * revisit; the form itself reports validation and success inline.
 */
export default async function AccountabilityProfilePage() {
  const { profile } = await requireUserProfile();

  return (
    <div className="section fade-enter" style={{ maxWidth: 640 }}>
      <Eyebrow>Your particulars</Eyebrow>
      <H1>Your practice profile.</H1>
      <Body className="muted" style={{ marginTop: 12 }}>
        Your region and practice type place you in a like-for-like benchmarking
        cohort. The more precise this is, the more useful your benchmarks become.
      </Body>

      <Divider />

      <ProfileSetupForm
        defaults={{
          practice_name: profile.practice_name ?? "",
          region: profile.region ?? "",
          practice_type: profile.practice_type ?? "",
          chair_count: profile.chair_count != null ? String(profile.chair_count) : "",
        }}
      />

      <div className="row" style={{ marginTop: 28 }}>
        <Button href="/accountability" variant="ghost" size="sm">
          Back to the accountability area
        </Button>
      </div>
    </div>
  );
}
