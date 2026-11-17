"use client";

import { type ReactNode } from "react";

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
