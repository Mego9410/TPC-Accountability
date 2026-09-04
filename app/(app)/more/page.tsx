import type { Metadata } from "next";
import Link from "next/link";
import { canSeeSociety, requireViewer } from "@/lib/session";
import { navFor } from "@/components/shell/nav-items";
import { HairlineList, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "More" };

const GROUP: Record<string, string> = {
  "/blocks": "Society",
  "/check-in": "Society",
  "/wins": "Society",
  "/benchmark": "Society",
  "/review": "Society",
  "/challenges": "Society",
  "/house": "The House",
  "/settings": "Account",
};

const DESCRIPTION: Record<string, string> = {
  "/home": "Your week at a glance.",
  "/mentor": "The principals you mentor, and how their weeks are going.",
  "/circle": "Your pair and your pod: who is in them, and what they have been up to.",
  "/blocks": "Twelve-week blocks and the commitments beneath them.",
  "/check-in": "Four short questions, once a week.",
  "/wins": "The ledger of what went right.",
  "/benchmark": "Your figures against practices like yours.",
  "/messages": "Notes between sittings, seen only by your circle.",
  "/calendar": "Every sitting in the diary, and the place to hold the next one.",
  "/house": "Members, circles and the running of the Club.",
  "/review": "A printed record of a block: what was kept and what was not.",
  "/challenges": "Short, optional sprints across the Club.",
  "/settings": "Your particulars, your practice and how you are addressed.",
};

export default async function MorePage() {
  const { profile } = await requireViewer();
  const society = canSeeSociety(profile);
  const primary = navFor(profile.role, society).map((i) => ({ href: i.href, label: i.label }));
  const extras: Array<{ href: string; label: string }> = [];
  if (society) {
    if (!primary.some((i) => i.href === "/wins")) extras.push({ href: "/wins", label: "Wins" });
    extras.push({ href: "/review", label: "Review" }, { href: "/challenges", label: "Challenges" });
  }
  extras.push({ href: "/settings", label: "Settings" });
  const items = [...primary, ...extras];

  return (
    <div className="section fade-enter">
      <PageHeader eyebrow="More" title="Everywhere you can go." lede="Every room in the Club that is open to you." />
      <HairlineList>
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="row">
            <div className="date">{GROUP[i.href] ?? "Club"}</div>
            <div>
              <div className="title">{i.label}</div>
              <div className="meta">{DESCRIPTION[i.href] ?? ""}</div>
            </div>
          </Link>
        ))}
        <a href="/auth/signout" className="row">
          <div className="date">Account</div>
          <div>
            <div className="title">Sign out</div>
            <div className="meta">Leave the Club for now. Your seat is kept.</div>
          </div>
        </a>
      </HairlineList>
    </div>
  );
}
