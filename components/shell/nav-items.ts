import type { MemberRole } from "@/lib/domain";

export type NavIcon = "house" | "people" | "target" | "door" | "message" | "key" | "dots";
export type NavItem = { href: string; label: string; short?: string; icon: NavIcon };

/** Server-safe: which destinations a viewer can reach. */
export function navFor(role: MemberRole): NavItem[] {
  const items: NavItem[] = [
    { href: "/home", label: "Home", icon: "house" },
    { href: "/partner", label: "Partner", icon: "people" },
    { href: "/goals", label: "Goals", icon: "target" },
    { href: "/visits", label: "Visits", icon: "door" },
    { href: "/members", label: "Members", icon: "dots" },
    { href: "/messages", label: "Correspondence", short: "Post", icon: "message" },
  ];
  if (role === "staff") items.push({ href: "/house", label: "The House", short: "House", icon: "key" });
  return items;
}
