"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const LINKS = [
  { href: "/dashboard", label: "The House", icon: IconHouse },
  { href: "/goals", label: "Goals", icon: IconTarget },
  { href: "/messages", label: "Correspondence", icon: IconMessage },
  { href: "/calendar", label: "Calendar", icon: IconCalendar },
  { href: "/settings", label: "Settings", icon: IconCog },
];

export function AppNav({
  membershipNo,
  initials,
}: {
  membershipNo: string;
  initials: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="tpc-topnav">
        <Link href="/dashboard" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mark" src="/brand/monogram-gold.png" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="w" src="/brand/wordmark-gold.png" alt="The Principals Club" />
        </Link>
        <nav className="links">
          {LINKS.slice(0, 4).map((l) => (
            <Link key={l.href} href={l.href} className={cn(isActive(l.href) && "active")}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="right">
          <span className="tpc-no">Member · No. {membershipNo}</span>
          <Link href="/settings" className="tpc-avatar" aria-label="Settings">
            {initials}
          </Link>
        </div>
      </header>

      <nav className="tpc-bottomnav">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href} className={cn(isActive(l.href) && "active")}>
              <Icon />
              <span>{l.label === "Correspondence" ? "Post" : l.label === "The House" ? "House" : l.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

/* ---- Lucide-weight inline icons (1.25px stroke, currentColor) ---- */
function base(props: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {props.children}
    </svg>
  );
}
function IconHouse() {
  return base({ children: (<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>) });
}
function IconTarget() {
  return base({ children: (<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></>) });
}
function IconMessage() {
  return base({ children: <path d="M4 5h16v11H8l-4 4V5Z" /> });
}
function IconCalendar() {
  return base({
    children: (<><rect x="4" y="5" width="16" height="16" rx="1" /><path d="M4 9h16M8 3v4M16 3v4" /></>),
  });
}
function IconCog() {
  return base({
    children: (<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>),
  });
}
