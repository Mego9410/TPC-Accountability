"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/for-mentees", label: "For mentees" },
  { href: "/for-mentors", label: "For mentors" },
  { href: "/visits", label: "Practice visits" },
  { href: "/membership", label: "Membership" },
];

/** The public header's links, with aria-current on the one you are reading. */
export function PublicNav() {
  const pathname = usePathname();
  return (
    <nav className="lp-nav" aria-label="Primary">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
