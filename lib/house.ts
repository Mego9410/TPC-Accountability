import type { CircleKind } from "@/lib/domain";

/** The House's section tabs. */
export const HOUSE_NAV = [
  { href: "/house", label: "Overview" },
  { href: "/house/members", label: "Members" },
  { href: "/house/circles", label: "Circles" },
];

/** Not in the domain label maps yet; kept here until it is. */
export const CIRCLE_KIND_LABEL: Record<CircleKind, string> = { pair: "Pair", pod: "Pod" };
