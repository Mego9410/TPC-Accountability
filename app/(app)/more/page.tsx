import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/lib/session";
import { navFor } from "@/components/shell/nav-items";
import { HairlineList, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "More" };

const GROUP: Record<string, string> = {
  "/home": "The Club",
  "/partner": "The Club",
  "/goals": "The Club",
  "/visits": "The Club",
  "/members": "The Club",
  "/messages": "The Club",
  "/house": "The House",
  "/settings": "Account",
};

const DESCRIPTION: Record<string, string> = {
  "/home": "Everything, on one screen.",
  "/partner": "The principal who keeps an eye on whether you are getting on with it.",
  "/goals": "What you are working on, and what has been written against it.",
  "/visits": "Mornings inside other practices, and mornings inside yours.",
  "/members": "Every principal in the Club. This is where a partner is found.",
  "/messages": "Notes between two members, and nobody else.",
  "/house": "The register: who is here, and who is with whom.",
  "/settings": "Your particulars, and what you are open to.",
};

export default async function MorePage() {
  const { profile } = await requireViewer();
  const items = [
    ...navFor(profile.role).map((i) => ({ href: i.href, label: i.label })),
    { href: "/settings", label: "Your particulars" },
  ];

  return (
    <div className="section fade-enter">
      <PageHeader eyebrow="More" title="Everywhere you can go." lede="Every room in the Club that is open to you." />
      <HairlineList>
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="row">
            <div className="date">{GROUP[i.href] ?? "The Club"}</div>
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
