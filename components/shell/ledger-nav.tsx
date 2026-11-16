"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";
import type { NavItem } from "./nav-items";

/* =========================================================================
   The Ledger's rail.

   A dark 272px column holding the destinations, the membership card and
   the way out. Below 900px it lies down and becomes a scrolling strip
   across the top, which is why there is no separate bottom bar any more.
   ------------------------------------------------------------------------- */

const PATHS: Record<string, string> = {
  ledger: "M4 3.5h9a2 2 0 0 1 2 2v11H6a2 2 0 0 1-2-2v-11zM7 7.5h5M7 10.5h5M7 13.5h3",
  people: "M7.5 9a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zM2.5 16.5c0-2.7 2.2-4.5 5-4.5s5 1.8 5 4.5M14 9.5a2.2 2.2 0 1 0 0-4.4M14.5 12.4c2.2 0 3.6 1.5 3.6 4.1",
  target: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  directory: "M8.5 15a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM13.5 13.5L18 18",
  visits: "M3 9.5L10 3l7 6.5M5 8v9h10V8M8.5 17v-5h3v5",
  notes: "M3 5h14v10H3zM3 5l7 6 7-6",
  key: "M7.5 14a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM11 10.5h6.5M15 10.5v2.5M17.5 10.5v2",
};

const ICON_FOR: Record<string, string> = {
  "/home": "ledger",
  "/partner": "people",
  "/goals": "target",
  "/members": "directory",
  "/visits": "visits",
  "/messages": "notes",
  "/house": "key",
};

export function LedgerNav({
  items,
  membershipNo,
  unread,
  visitsUsed,
  visitsAllowed,
  founding,
}: {
  items: NavItem[];
  membershipNo: string;
  unread: number;
  visitsUsed: number;
  visitsAllowed: number;
  founding?: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="lg-nav" aria-label="The Ledger">
      <Link href="/home" className="lg-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/monogram.png" alt="" />
        <span className="lg-wordmark">The Ledger</span>
      </Link>

      <nav className="lg-list" aria-label="Primary">
        {items.map((l) => {
          const active = isActive(l.href);
          const badge = l.href === "/messages" && unread > 0 ? unread : null;
          return (
            <Link key={l.href} href={l.href} className={cn(active && "on")} aria-current={active ? "page" : undefined}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <path d={PATHS[ICON_FOR[l.href] ?? "ledger"]} />
              </svg>
              <span>{l.label}</span>
              {badge !== null && <span className="lg-badge" aria-label={`${badge} unread`}>{badge}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="lg-foot">
        <div className="lg-member">
          <p className="eyebrow gold">Membership</p>
          <p className="lg-no">No. {membershipNo}{founding ? " · Founding" : ""}</p>
          <p className="lg-visits">Visits this year: {visitsUsed} of {visitsAllowed}</p>
        </div>
        <div className="lg-foot-links">
          <Link href="/settings">Your particulars</Link>
          <a href="/auth/signout">Sign out</a>
        </div>
      </div>
    </aside>
  );
}
