import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { currentWeekKey } from "@/lib/weeks";
import { SubNav } from "@/components/shell/nav";
import { Button, Caption, Card, Eyebrow, H3, PageHeader, Person, Stat, TextLink } from "@/components/ui";

export const metadata: Metadata = { title: "The House" };

export const HOUSE_NAV = [
  { href: "/house", label: "Overview" },
  { href: "/house/members", label: "Members" },
  { href: "/house/circles", label: "Circles" },
];

export default async function HousePage() {
  const { repo } = await requireViewer({ roles: ["staff"] });
  const [members, circles] = await Promise.all([repo.listAllProfiles(), repo.listAllCircles()]);
  const active = circles.filter((c) => c.status === "active");
  const seated = new Set(active.flatMap((c) => c.members.map((m) => m.userId)));
  const unseated = members.filter((m) => !seated.has(m.id));
  const mentors = members.filter((m) => m.role === "mentor");
  const society = members.filter((m) => m.tier === "society");
  const checkIns = await repo.listCheckInsFor(society.map((m) => m.id), 500);
  const thisWeek = new Set(checkIns.filter((c) => c.weekKey === currentWeekKey()).map((c) => c.userId));
  const quiet = society.filter((m) => !thisWeek.has(m.id));

  return (
    <div className="section fade-enter">
      <SubNav items={HOUSE_NAV} />
      <PageHeader eyebrow="The House" title="The Club at a glance." lede="Who is in, who is seated, and who has gone quiet. The week's picture is on the home page." />

      <div className="stat-row">
        <Stat value={members.length} label="Principals" sub="on the books" />
        <Stat value={mentors.length} label="Mentors" sub={`${mentors.reduce((n, m) => n + (m.mentorCapacity ?? 0), 0)} seats offered`} />
        <Stat value={society.length} label="In the Society" sub={`${members.length - society.length} members`} tone="gold" />
        <Stat value={active.length} label="Circles" sub={`${active.filter((c) => c.kind === "pair").length} pairs · ${active.filter((c) => c.kind === "pod").length} pods`} />
      </div>

      <div className="grid-even">
        <Card emphasis={unseated.length > 0}>
          <Eyebrow>Waiting for a seat</Eyebrow>
          {unseated.length === 0 ? (
            <>
              <H3>Everyone is seated.</H3>
              <Caption>New principals appear here the moment they finish their introduction.</Caption>
            </>
          ) : (
            unseated.map((m) => <Person key={m.id} name={m.fullName} meta={m.practiceName ?? "Principal"} href="/house/members" size="sm" />)
          )}
          <div className="row gap-4 wrap" style={{ marginTop: 6 }}>
            <Button href="/house/circles" size="sm" variant="secondary">Form a circle</Button>
            <TextLink href="/house/members">All members</TextLink>
          </div>
        </Card>

        <Card>
          <Eyebrow>Gone quiet this week</Eyebrow>
          {quiet.length === 0 ? (
            <>
              <H3>Everyone in the Society has checked in.</H3>
              <Caption>A rare and fine thing.</Caption>
            </>
          ) : (
            quiet.slice(0, 6).map((m) => <Person key={m.id} name={m.fullName} meta={m.practiceName ?? "Principal"} href="/house/members" size="sm" />)
          )}
          {quiet.length > 6 && <Caption>And {quiet.length - 6} more.</Caption>}
          <div className="row" style={{ marginTop: 6 }}>
            <TextLink href="/home">This week&rsquo;s picture</TextLink>
          </div>
        </Card>
      </div>
    </div>
  );
}
