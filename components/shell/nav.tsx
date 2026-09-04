"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";
import type { NavItem } from "./nav-items";

export function TopNav({ items, membershipNo, initials, unread }: { items: NavItem[]; membershipNo: string; initials: string; unread: number }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <header className="tpc-topnav">
      <Link href="/home" className="brand" aria-label="The Principals Club, home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mark" src="/brand/monogram-gold.png" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="w" src="/brand/wordmark-gold.png" alt="The Principals Club" />
      </Link>
      <nav className="links" aria-label="Primary">
        {items.map((l) => (
          <Link key={l.href} href={l.href} className={cn(isActive(l.href) && "active")} aria-current={isActive(l.href) ? "page" : undefined}>
            {l.label}
            {l.href === "/messages" && unread > 0 && <span className="pip" aria-label={`${unread} unread`} />}
          </Link>
        ))}
      </nav>
      <div className="right">
        <span className="tpc-no">No. {membershipNo}</span>
        <Link href="/settings" className="tpc-avatar" aria-label="Settings">{initials}</Link>
      </div>
    </header>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const primary = items.filter((i) => ["/home", "/mentor", "/circle", "/blocks", "/check-in"].includes(i.href)).slice(0, 4);
  const more: NavItem = { href: "/more", label: "More", icon: "dots" };
  const moreActive = !primary.some((i) => isActive(i.href));
  return (
    <nav className="tpc-bottomnav" aria-label="Primary">
      {[...primary, more].map((l) => {
        const Icon = ICONS[l.icon];
        const active = l.href === "/more" ? moreActive : isActive(l.href);
        return (
          <Link key={l.href} href={l.href} className={cn(active && "active")} aria-current={active ? "page" : undefined}>
            <Icon />
            <span>{l.short ?? l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SubNav({ items }: { items: Array<{ href: string; label: string }> }) {
  const pathname = usePathname();
  return (
    <nav className="subnav" aria-label="Section">
      {items.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link key={l.href} href={l.href} className={cn(active && "active")} aria-current={active ? "page" : undefined}>{l.label}</Link>
        );
      })}
    </nav>
  );
}

/* ---- Icons: 1.25px stroke, currentColor ---- */
function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const ICONS = {
  house: () => <Svg><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></Svg>,
  people: () => <Svg><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.5c3 0 5.5 2 5.5 5.5" /></Svg>,
  circle: () => <Svg><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="8" r="2" /><circle cx="8" cy="15" r="2" /><circle cx="16" cy="15" r="2" /></Svg>,
  target: () => <Svg><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></Svg>,
  check: () => <Svg><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M8 12.5l3 3 5-6" /></Svg>,
  star: () => <Svg><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.8l6.1-.7z" /></Svg>,
  bars: () => <Svg><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></Svg>,
  message: () => <Svg><path d="M4 5h16v11H8l-4 4V5Z" /></Svg>,
  calendar: () => <Svg><rect x="4" y="5" width="16" height="16" rx="1" /><path d="M4 9h16M8 3v4M16 3v4" /></Svg>,
  key: () => <Svg><circle cx="8" cy="12" r="4" /><path d="M12 12h9M18 12v3M21 12v2" /></Svg>,
  dots: () => <Svg><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></Svg>,
};
