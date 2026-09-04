import type { MemberRole } from "@/lib/domain";

export type NavIcon = "house" | "people" | "circle" | "door" | "target" | "check" | "star" | "bars" | "message" | "calendar" | "key" | "dots";
export type NavItem = { href: string; label: string; short?: string; icon: NavIcon };

/** Server-safe: which destinations a viewer can reach. */
export function navFor(role: MemberRole, society: boolean): NavItem[] {
  const items: NavItem[] = [{ href: "/home", label: "Home", icon: "house" }];
  if (role === "mentor") items.push({ href: "/mentor", label: "Mentees", icon: "people" });
  items.push({ href: "/circle", label: "Circle", icon: "circle" });
  items.push({ href: "/visits", label: "Visits", icon: "door" });
  if (society) {
    items.push(
      { href: "/blocks", label: "Blocks", icon: "target" },
      { href: "/check-in", label: "Check-in", icon: "check" },
      { href: "/wins", label: "Wins", icon: "star" },
      { href: "/benchmark", label: "Benchmark", icon: "bars" },
    );
  }
  items.push({ href: "/messages", label: "Correspondence", short: "Post", icon: "message" });
  items.push({ href: "/calendar", label: "Calendar", icon: "calendar" });
  if (role === "staff") items.push({ href: "/house", label: "The House", short: "House", icon: "key" });
  return items;
}
