"use client";

import { useRef, type ReactNode } from "react";

/* =========================================================================
   The page's ground.

   It carries three classes the stylesheet keys off — `motion`, `intro` and
   `cur` — and tracks the pointer so the ring cursor can follow it. Every one
   of them is gated in CSS: `motion` does nothing under a reduced-motion
   preference, and `cur` does nothing without a fine pointer, so a touch
   device and a careful reader both get the plain page.

   Children are rendered on the server and passed through, so making this a
   client component costs the page nothing.
   ------------------------------------------------------------------------- */

export function HomeShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="h motion intro cur"
      id="top"
      onMouseMove={(e) => {
        const el = e.currentTarget;
        el.style.setProperty("--cx", `${e.clientX}px`);
        el.style.setProperty("--cy", `${e.clientY}px`);
      }}
    >
      <div className="cursor" aria-hidden="true"><span /></div>
      {children}
    </div>
  );
}

/**
 * A link that leans very slightly towards the pointer. Decorative only: it
 * is an ordinary anchor with an ordinary href, so it behaves the same to a
 * keyboard, a screen reader and a right-click.
 */
export function MagLink({
  href,
  className = "lpbtn mag",
  children,
  style,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <a
      href={href}
      className={className}
      style={style}
      onMouseMove={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${((e.clientX - r.left - r.width / 2) * 0.3).toFixed(1)}px`);
        el.style.setProperty("--my", `${((e.clientY - r.top - r.height / 2) * 0.45).toFixed(1)}px`);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.setProperty("--mx", "0px");
        e.currentTarget.style.setProperty("--my", "0px");
      }}
    >
      {children}
    </a>
  );
}

/** The arrow inside the primary call to action. */
export function Arrow() {
  return (
    <svg className="arr" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25">
      <path d="M2 8h12M9 3l5 5-5 5" />
    </svg>
  );
}
