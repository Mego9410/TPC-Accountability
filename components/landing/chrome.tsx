import Link from "next/link";
import { MARK, WORDMARK } from "./photos";
import { MagLink } from "./shell";

/* =========================================================================
   The site head and foot, in the new design.

   The head is sticky and sits *over* the hero rather than above it — hence
   the negative bottom margin — and thickens into a blurred bar as the page
   scrolls, driven by a scroll timeline in CSS rather than a listener here.
   ------------------------------------------------------------------------- */

const NAV = [
  { href: "/#partner", label: "The partner" },
  { href: "/#visits", label: "The visit" },
  { href: "/membership", label: "Membership" },
  { href: "/practice-visits", label: "The morning" },
];

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="site-head">
      <span className="prog" aria-hidden="true" />
      <div
        className="lpwrap"
        style={{ height: 88, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}
      >
        <Link
          href="/"
          aria-label="The Principals Club, home"
          style={{ display: "flex", alignItems: "center", gap: 18, textDecoration: "none", minHeight: 44 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} alt="" style={{ width: 34, height: "auto" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={WORDMARK} alt="The Principals Club" className="hide-m" style={{ width: 230, height: "auto" }} />
        </Link>

        <nav aria-label="Primary" style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <span className="hide-m" style={{ display: "flex", gap: 34 }}>
            {NAV.map((n) => (
              <Link key={n.href} className="navlink" href={n.href}>
                <span className="roll-box">
                  <span className="roll"><span data-t={n.label}>{n.label}</span></span>
                </span>
              </Link>
            ))}
          </span>
          <Link className="navlink hide-m" href={signedIn ? "/home" : "/login"} style={{ color: "#C5B793" }}>
            {signedIn ? "The Ledger" : "Sign in"}
          </Link>
          <MagLink href="/signup" style={{ minHeight: 44, padding: "0 20px" }}>
            Request an introduction
          </MagLink>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <footer className="site-foot" style={{ background: "#0C1217", borderTop: "1px solid rgba(197,183,147,0.2)" }}>
      <div className="lpwrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={WORDMARK}
          alt="The Principals Club"
          style={{ width: "100%", maxWidth: 1328, height: "auto", opacity: 0.92 }}
        />
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24,
            flexWrap: "wrap", marginTop: 72, paddingTop: 28, borderTop: "1px solid rgba(197,183,147,0.2)",
          }}
        >
          <p style={{ margin: 0, font: "500 13px/1.5 var(--font-sans)", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(246,241,230,0.72)" }}>
            An accountability club for principal dentists · Est. MMXXVI
          </p>
          <nav aria-label="Footer" className="foot-links" style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <Link href="/house-rules">House rules</Link>
            <Link href="/privacy">Privacy</Link>
            <a href="mailto:house@principalsclub.co.uk">Write to the House</a>
            <Link href={signedIn ? "/home" : "/login"}>{signedIn ? "The Ledger" : "Sign in"}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
