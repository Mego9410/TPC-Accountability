import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer, canSeeSociety } from "@/lib/session";
import { address, firstName, menteesOf, mentorOf, othersIn, BLOCK_WEEKS, type CircleWithMembers, type Profile } from "@/lib/domain";
import { memberSnapshot, nextSitting, circleTitle, type MemberSnapshot } from "@/lib/queries";
import { currentWeekKey, formatAppointment, relativeDays, weekLabel } from "@/lib/weeks";
import { BENCHMARK_METRICS, formatMetric } from "@/lib/benchmarks";
import {
  Body, Button, Caption, Card, CommitmentBadge, Display, Divider, EmptyState, Eyebrow, H3, Notice, Person, Section, Stat, TextLink, WeekStrip,
} from "@/components/ui";
import { CommitmentQuickActions } from "@/components/commitments";

export const metadata: Metadata = { title: "Home" };

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const viewer = await requireViewer();
  const { profile, repo, userId } = viewer;
  const { welcome } = await searchParams;
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  if (profile.role === "staff") return <StaffHome />;

  const circles = await repo.listCirclesFor(userId);
  const [snap, next] = await Promise.all([memberSnapshot(repo, profile), nextSitting(repo, circles)]);
  const mentor = mentorOf(circles, userId);
  const society = canSeeSociety(profile);

  return (
    <div className="section fade-enter">
      {welcome === "society" && (
        <Notice tone="ok">Welcome to the Society. Your first block and this week&rsquo;s check-in are below.</Notice>
      )}
      <div>
        <Eyebrow>{today}</Eyebrow>
        <Display>{greeting()}, {firstName(profile)}.</Display>
        <Body lg className="muted maxw-prose" style={{ marginTop: 12 }}>{headline(snap, next?.sitting.scheduledAt ?? null, mentor)}</Body>
      </div>

      <Divider />

      <div className="grid-sidebar">
        <div className="stack gap-8">
          {society ? <ThisWeek snap={snap} /> : <SocietyInvite />}

          {profile.role === "mentor" && <MenteesStrip circles={circles} mentorId={userId} repo={repo} />}

          {society && <BlockCard snap={snap} />}
        </div>

        <div className="stack gap-6">
          <Card emphasis>
            <Eyebrow>Your standing</Eyebrow>
            <div className="stat-row">
              <Stat value={snap.score} label="Consistency" sub="of 100" tone="gold" />
              <Stat value={snap.streak} label={snap.streak === 1 ? "week streak" : "week streak"} sub={snap.checkedInThisWeek ? "this week counted" : "check in to extend"} />
            </div>
          </Card>

          <Card>
            <Eyebrow>{next ? "Your next sitting" : "No sitting held"}</Eyebrow>
            {next ? (
              <>
                <H3>{formatAppointment(next.sitting.scheduledAt)}</H3>
                <Caption>{relativeDays(next.sitting.scheduledAt)} · {circleTitle(next.circle, userId)}</Caption>
                <div className="row gap-4 wrap" style={{ marginTop: 6 }}>
                  <Button href={`/sittings/${next.sitting.id}`} size="sm">Prepare</Button>
                  <TextLink href="/calendar">All sittings</TextLink>
                </div>
              </>
            ) : (
              <>
                <H3>Arrange your next sitting.</H3>
                <Caption>A standing time is the whole point.</Caption>
                <div className="row" style={{ marginTop: 6 }}>
                  <Button href="/calendar" size="sm" variant="secondary">Arrange a sitting</Button>
                </div>
              </>
            )}
          </Card>

          <CircleCard circles={circles} viewerId={userId} mentor={mentor} />

          {society && <BenchmarkGlance userId={userId} repo={repo} />}
        </div>
      </div>
    </div>
  );
}

function headline(snap: MemberSnapshot, nextAt: string | null, mentor: Profile | null): string {
  const parts: string[] = [];
  if (snap.block && snap.week) {
    parts.push(`Week ${snap.week} of ${BLOCK_WEEKS} on “${snap.block.title}”.`);
    if (snap.openThisWeek > 0) parts.push(`${snap.openThisWeek} ${snap.openThisWeek === 1 ? "commitment" : "commitments"} still open this week.`);
    else if (snap.thisWeek.length > 0) parts.push("Everything set down for this week is kept.");
  } else {
    parts.push("No block is running. Twelve weeks starts with one outcome.");
  }
  if (!snap.checkedInThisWeek) parts.push("Your check-in is waiting.");
  if (nextAt) parts.push(`You sit ${mentor ? `with ${address(mentor)} ` : ""}${relativeDays(nextAt)}.`);
  return parts.join(" ");
}

function ThisWeek({ snap }: { snap: MemberSnapshot }) {
  return (
    <Section title="This week" aside={snap.block && <TextLink href={`/blocks/${snap.block.id}`}>The whole block</TextLink>}>
      <Card emphasis={!snap.checkedInThisWeek}>
        <div className="row between wrap">
          <div>
            <H3>{snap.checkedInThisWeek ? "Checked in." : "Your check-in is waiting."}</H3>
            <Caption>
              {snap.checkedInThisWeek
                ? `Logged for ${weekLabel(snap.latestCheckIn!.weekKey)}. Energy ${snap.latestCheckIn!.energy ?? "—"} of 10.`
                : "Four short questions. You never face a blank page."}
            </Caption>
          </div>
          <Button href="/check-in" size="sm" variant={snap.checkedInThisWeek ? "secondary" : "primary"}>
            {snap.checkedInThisWeek ? "Revise" : "Check in"}
          </Button>
        </div>
      </Card>

      {snap.block ? (
        snap.thisWeek.length > 0 ? (
          <div>
            {snap.thisWeek.map((c) => (
              <div key={c.id} className={`commitment ${c.status}`}>
                <div className="cm-week">Wk {c.week}</div>
                <div>
                  <div className="cm-text">{c.text}</div>
                  {c.carriedFrom && <div className="cm-meta">Carried from an earlier week.</div>}
                </div>
                <div className="cm-actions">
                  {c.status === "open" ? <CommitmentQuickActions id={c.id} canCarry={c.week < BLOCK_WEEKS} /> : <CommitmentBadge status={c.status} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={`Nothing set down for week ${snap.week}.`} action={<Button href={`/blocks/${snap.block.id}#add`} size="sm" variant="secondary">Set a commitment</Button>}>
            One or two things you will actually do this week.
          </EmptyState>
        )
      ) : null}
    </Section>
  );
}

function BlockCard({ snap }: { snap: MemberSnapshot }) {
  if (!snap.block) {
    return (
      <Card>
        <Eyebrow>No active block</Eyebrow>
        <H3>Begin a twelve-week block.</H3>
        <Caption>One outcome, weekly commitments beneath it, and a record of what was kept.</Caption>
        <div className="row" style={{ marginTop: 6 }}>
          <Button href="/blocks/new" size="sm">Start a block</Button>
        </div>
      </Card>
    );
  }
  return (
    <Section title={`Your block · week ${snap.week} of ${BLOCK_WEEKS}`}>
      <Card>
        <Link href={`/blocks/${snap.block.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <H3>{snap.block.title}</H3>
        </Link>
        {snap.block.description && <Caption>{snap.block.description}</Caption>}
        <WeekStrip current={snap.week!} weekStatus={snap.weekStatus} />
        <Caption>
          {snap.commitments.filter((c) => c.status === "done").length} kept · {snap.commitments.filter((c) => c.status === "missed").length} missed · {snap.commitments.filter((c) => c.status === "carried").length} carried
        </Caption>
      </Card>
    </Section>
  );
}

function SocietyInvite() {
  return (
    <Card emphasis>
      <Eyebrow>The Society</Eyebrow>
      <H3>Twelve-week blocks, a weekly check-in, and the benchmark.</H3>
      <Caption>Members keep their circle and their correspondence. The Society adds the record of what was kept.</Caption>
      <div className="row" style={{ marginTop: 6 }}>
        <Button href="/upgrade" size="sm">Join the Society</Button>
      </div>
    </Card>
  );
}

function CircleCard({ circles, viewerId, mentor }: { circles: CircleWithMembers[]; viewerId: string; mentor: Profile | null }) {
  if (circles.length === 0) {
    return (
      <Card>
        <Eyebrow>Your circle</Eyebrow>
        <H3>You are in the queue.</H3>
        <Caption>The House is finding you a principal of fitting ambition and hour. You will be told the moment a seat is found.</Caption>
      </Card>
    );
  }
  const pair = circles.find((c) => c.kind === "pair");
  const pod = circles.find((c) => c.kind === "pod");
  return (
    <Card>
      <Eyebrow>Your circle</Eyebrow>
      {mentor && <Person name={mentor.fullName} meta={`Your mentor · ${mentor.practiceName ?? "Principal"}`} href="/circle" />}
      {!mentor && pair && othersIn(pair, viewerId).map((m) => (
        <Person key={m.userId} name={m.profile.fullName} meta={`${m.role === "mentee" ? "Your mentee" : "Your partner"} · ${m.profile.practiceName ?? "Principal"}`} href="/circle" />
      ))}
      {pod && <Caption>{pod.name} · {pod.members.length} principals · {pod.cohortLabel}</Caption>}
      <div className="row gap-4" style={{ marginTop: 4 }}>
        <Button href="/circle" size="sm" variant="secondary">Open your circle</Button>
        <TextLink href="/messages">Write a note</TextLink>
      </div>
    </Card>
  );
}

async function BenchmarkGlance({ userId, repo }: { userId: string; repo: import("@/lib/repo/types").Repo }) {
  const entries = await repo.listBenchmarkEntries(userId);
  const latest = BENCHMARK_METRICS.map((m) => ({ m, e: entries.filter((x) => x.metricKey === m.key).at(-1) })).filter((x) => x.e);
  return (
    <Card>
      <Eyebrow>The benchmark</Eyebrow>
      {latest.length === 0 ? (
        <>
          <H3>No figures yet.</H3>
          <Caption>One number unlocks your cohort comparison.</Caption>
        </>
      ) : (
        <dl className="kv-list">
          {latest.slice(0, 3).map(({ m, e }) => (
            <div key={m.key} className="kv-row">
              <dt>{m.short}</dt>
              <dd>{formatMetric(m.kind, e!.value)}</dd>
            </div>
          ))}
        </dl>
      )}
      <TextLink href="/benchmark">Where you stand</TextLink>
    </Card>
  );
}

async function MenteesStrip({ circles, mentorId, repo }: { circles: CircleWithMembers[]; mentorId: string; repo: import("@/lib/repo/types").Repo }) {
  const mentees = menteesOf(circles, mentorId).filter((p) => circles.some((c) => c.kind === "pair" && c.members.some((m) => m.userId === p.id)));
  if (mentees.length === 0) return null;
  const snaps = await Promise.all(mentees.map((p) => memberSnapshot(repo, p)));
  return (
    <Section title="Your mentees" aside={<TextLink href="/mentor">All mentees</TextLink>}>
      <div className="card-grid">
        {snaps.map((s) => (
          <Card key={s.profile.id} pad="sm">
            <Person name={s.profile.fullName} meta={s.block ? `Week ${s.week} · ${s.block.title}` : "No block running"} href={`/mentor/${s.profile.id}`} size="sm" />
            {s.block && <WeekStrip current={s.week!} weekStatus={s.weekStatus} compact />}
            <Caption>
              {s.checkedInThisWeek ? "Checked in this week" : "Not yet checked in"} · {s.openThisWeek} open · streak {s.streak}
            </Caption>
          </Card>
        ))}
      </div>
    </Section>
  );
}

async function StaffHome() {
  const { repo } = await requireViewer();
  const [members, circles] = await Promise.all([repo.listAllProfiles(), repo.listAllCircles()]);
  const seated = new Set(circles.flatMap((c) => c.members.map((m) => m.userId)));
  const unseated = members.filter((m) => !seated.has(m.id));
  const checkIns = await repo.listCheckInsFor(members.map((m) => m.id), 500);
  const thisWeek = new Set(checkIns.filter((c) => c.weekKey === currentWeekKey()).map((c) => c.userId));
  const society = members.filter((m) => m.tier === "society");
  return (
    <div className="section fade-enter">
      <div>
        <Eyebrow>The House</Eyebrow>
        <Display>The Club this week.</Display>
      </div>
      <Divider />
      <div className="stat-row">
        <Stat value={members.length} label="Principals" sub={`${members.filter((m) => m.role === "mentor").length} mentors`} />
        <Stat value={society.length} label="In the Society" sub={`${members.length - society.length} members`} />
        <Stat value={circles.filter((c) => c.status === "active").length} label="Circles" sub={`${circles.filter((c) => c.kind === "pod").length} pods`} />
        <Stat value={`${Math.round((thisWeek.size / Math.max(1, society.length)) * 100)}%`} label="Checked in" sub="of the Society, this week" tone={thisWeek.size / Math.max(1, society.length) > 0.6 ? "ok" : "warn"} />
      </div>
      <div className="grid-even">
        <Card emphasis={unseated.length > 0}>
          <Eyebrow>Waiting for a seat</Eyebrow>
          {unseated.length === 0 ? <H3>Everyone is seated.</H3> : unseated.map((m) => <Person key={m.id} name={m.fullName} meta={m.practiceName ?? "Principal"} href={`/house/members`} size="sm" />)}
          <div className="row" style={{ marginTop: 6 }}>
            <Button href="/house/circles" size="sm" variant="secondary">Form a circle</Button>
          </div>
        </Card>
        <Card>
          <Eyebrow>Not yet checked in</Eyebrow>
          {society.filter((m) => !thisWeek.has(m.id)).slice(0, 6).map((m) => (
            <Person key={m.id} name={m.fullName} meta={m.practiceName ?? "Principal"} size="sm" href="/house/members" />
          ))}
          {society.every((m) => thisWeek.has(m.id)) && <H3>Everyone has checked in.</H3>}
        </Card>
      </div>
    </div>
  );
}
