import Link from "next/link";
import { Button } from "@/components/ui";
import { Footer } from "@/components/shell/chrome";
import { PublicNav } from "@/components/landing/public-nav";
import { getViewer } from "@/lib/session";
import "./public.css";

/**
 * The public side of the Club: landing, the two audiences, membership, the
 * documents, the tour, and the door itself. No sign-in is required; a signed-in
 * principal is offered the way back in.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const signedIn = viewer !== null;

  return (
    <div className="lp-shell">
      <header className="lp-header">
        <Link href="/" className="lp-brand" aria-label="The Principals Club, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lp-mark" src="/brand/monogram-gold.png" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lp-word" src="/brand/wordmark-gold.png" alt="The Principals Club" />
        </Link>
        <PublicNav />
        <div className="lp-actions">
          <Button href="/tour" variant="ghost" onDark>Tour the House</Button>
          {signedIn ? (
            <Button href="/home" variant="secondary" size="sm" onDark>Enter the House</Button>
          ) : (
            <Button href="/login" variant="secondary" size="sm" onDark>Sign in</Button>
          )}
        </div>
      </header>
      <main className="lp-main" id="main">{children}</main>
      <Footer signedIn={signedIn} />
    </div>
  );
}
