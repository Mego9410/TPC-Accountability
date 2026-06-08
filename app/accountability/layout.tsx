import Link from "next/link";
import { requireUserProfile } from "@/lib/auth";
import { Body, Button, Card, Divider, Eyebrow, H1, H3, Caption } from "@/components/ui";

/**
 * Paywall gate for the accountability area (master doc Step 1.3).
 *
 * The gate is enforced here, in a Server Component — a free member never
 * receives the protected UI, so there is no client-side bypass. Paid members
 * pass through to the area; everyone else is shown an inline locked teaser
 * (no redirect, no alert).
 */
export default async function AccountabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUserProfile();
  const isAdmin = profile.role === "house";
  const hasAccess = profile.is_paid_member || isAdmin;

  return (
    <div className="tpc-frame">
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "20px 24px",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <Link href="/dashboard" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mark" src="/brand/monogram-gold.png" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="w" src="/brand/wordmark-gold.png" alt="The Principals Club" />
        </Link>
        <span className="tpc-no">Accountability</span>
      </header>

      {hasAccess && <AreaNav isAdmin={isAdmin} />}

      <main className="tpc-page">{hasAccess ? children : <LockedTeaser />}</main>
    </div>
  );
}

function AreaNav({ isAdmin }: { isAdmin: boolean }) {
  const links = [
    { href: "/accountability", label: "Overview" },
    { href: "/accountability/blocks", label: "Goal blocks" },
    { href: "/accountability/templates", label: "Templates" },
    { href: "/accountability/check-in", label: "Check-in" },
    { href: "/accountability/pod", label: "Pod" },
    { href: "/accountability/benchmark", label: "Benchmark" },
    { href: "/accountability/challenges", label: "Challenges" },
    { href: "/accountability/wins", label: "Win log" },
    { href: "/accountability/review", label: "Review" },
    { href: "/accountability/profile", label: "Profile" },
    ...(isAdmin ? [{ href: "/accountability/admin/pods", label: "Admin · Pods" }] : []),
  ];
  return (
    <nav
      style={{
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        padding: "12px 24px",
        borderBottom: "1px solid var(--rule)",
        font: "500 11px/1 var(--font-sans)",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      }}
    >
      {links.map((l) => (
        <Link key={l.href} href={l.href} style={{ color: "var(--fg-muted)", textDecoration: "none" }}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

function LockedTeaser() {
  return (
    <div className="section fade-enter">
      <Eyebrow>A members&rsquo; tier</Eyebrow>
      <H1>The accountability society.</H1>
      <Body lg className="muted" style={{ maxWidth: 640 }}>
        Structured twelve-week goal blocks, a permanent log of what you have kept,
        a pod of fellow principals, and anonymised benchmarking against practices
        like yours. Reserved for paid members of the Club.
      </Body>

      <Divider />

      <Card emphasis style={{ maxWidth: 560 }}>
        <Eyebrow>Your membership</Eyebrow>
        <H3>This area is part of the paid tier.</H3>
        <Caption>
          Upgrade your membership to enter, set your first goal block, and see
          where your practice stands against the cohort.
        </Caption>
        <div className="row" style={{ marginTop: 12 }}>
          <Button href="/settings">Upgrade your membership</Button>
          <Button href="/dashboard" variant="ghost">
            Return to the House
          </Button>
        </div>
      </Card>
    </div>
  );
}
