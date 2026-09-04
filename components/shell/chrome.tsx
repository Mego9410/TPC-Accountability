import Link from "next/link";
import type { PersonaKey } from "@/lib/repo/demo";

const PERSONA_LABEL: Record<PersonaKey, string> = {
  member: "a member",
  mentor: "a mentor",
  house: "the House",
};

/** The furnished-example banner: says what it is, lets you change seat, lets you leave. */
export function TourBar({ persona }: { persona: PersonaKey }) {
  const others = (Object.keys(PERSONA_LABEL) as PersonaKey[]).filter((p) => p !== persona);
  return (
    <div className="tour-bar" role="status">
      <span className="long">You are touring a furnished example as {PERSONA_LABEL[persona]}. Your changes are kept in this browser only.</span>
      <span className="short">Touring as {PERSONA_LABEL[persona]}.</span>
      <span className="sep" aria-hidden="true">·</span>
      <span>
        <span className="long">See it as </span><span className="short">As </span>
        {others.map((p, i) => (
          <span key={p}>
            <a href={`/api/tour?as=${p}`}>{PERSONA_LABEL[p]}</a>
            {i < others.length - 1 ? " or " : ""}
          </span>
        ))}
      </span>
      <span className="sep" aria-hidden="true">·</span>
      <a href="/api/tour/exit">Leave the tour</a>
    </div>
  );
}

export function Footer({ signedIn }: { signedIn?: boolean }) {
  return (
    <footer className="tpc-footer">
      <span>The Principals Club · Est. MMXXVI</span>
      <nav aria-label="Footer">
        <Link href="/house-rules">House rules</Link>
        <Link href="/privacy">Privacy</Link>
        <a href="mailto:house@principalsclub.co.uk">Write to the House</a>
        {signedIn ? <a href="/auth/signout">Sign out</a> : <Link href="/login">Sign in</Link>}
      </nav>
    </footer>
  );
}
