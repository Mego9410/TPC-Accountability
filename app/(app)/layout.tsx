import { redirect } from "next/navigation";
import { requireUserProfile, initials } from "@/lib/auth";
import { isPreviewMode } from "@/lib/preview";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUserProfile();
  const preview = await isPreviewMode();

  if (!profile.onboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="tpc-frame">
      {preview && <PreviewBar />}
      <AppNav
        membershipNo={profile.membership_no ?? "————"}
        initials={initials(profile.full_name)}
      />
      <main className="tpc-page">{children}</main>
      <AppFooter />
    </div>
  );
}

function PreviewBar() {
  return (
    <div
      style={{
        background: "var(--tpc-midnight-deep)",
        color: "var(--fg-muted)",
        borderBottom: "1px solid var(--rule)",
        padding: "8px 24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        font: "500 10px/1.4 var(--font-sans)",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        textAlign: "center",
      }}
    >
      <span>You are touring a furnished example — nothing here is saved.</span>
      <a href="/auth/signout" style={{ color: "var(--accent)", textDecoration: "none" }}>
        Exit preview
      </a>
    </div>
  );
}
