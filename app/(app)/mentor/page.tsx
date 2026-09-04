import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { BLOCK_WEEKS, firstName, menteesOf, type CircleWithMembers, type Profile, type Sitting } from "@/lib/domain";
import { memberSnapshot, type MemberSnapshot } from "@/lib/queries";
import { formatAppointment, relativeDays, weekLabel } from "@/lib/weeks";
import { addNote } from "@/lib/actions/notes";
import { Badge, Caption, Card, EmptyState, PageHeader, Person, Stat, TextArea, TextLink, WeekStrip } from "@/components/ui";
import { Form, SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "Your mentees" };

type Seat = { profile: Profile; circle: CircleWithMembers; kind: "pair" | "pod" };

/** Pair mentees first, then the pod members the viewer leads, each with the circle they share. */
function seatsFor(circles: CircleWithMembers[], mentorId: string): Seat[] {
  const mentees = menteesOf(circles, mentorId);
  const pairs = circles.filter((c) => c.kind === "pair");
  const pods = circles.filter((c) => c.kind === "pod");
  const seats: Seat[] = [];
  for (const p of mentees) {
    const pair = pairs.find((c) => c.members.some((m) => m.userId === p.id));
    if (pair) seats.push({ profile: p, circle: pair, kind: "pair" });
  }
  for (const p of mentees) {
    if (seats.some((s) => s.profile.id === p.id)) continue;
    const pod = pods.find((c) => c.members.some((m) => m.userId === p.id));
    if (pod) seats.push({ profile: p, circle: pod, kind: "pod" });
  }
  return seats;
}

export default async function MentorPage() {
  const { profile, repo, userId } = await requireViewer({ roles: ["mentor", "staff"] });
  const circles = await repo.listCirclesFor(userId);
  const seats = seatsFor(circles, userId);

  if (seats.length === 0) {
    const capacity = profile.mentorCapacity;
    return (
      <div className="section fade-enter">
        <PageHeader eyebrow="Mentoring" title="Your mentees" lede="Everyone you sit with, and how their week is going." />
        <EmptyState title="No mentees seated yet" action={<TextLink href="/settings#mentoring">Your mentoring particulars</TextLink>}>
          The House seats mentees with you as principals join who suit your focus and your hours.
          {capacity
            ? ` You have said you will take ${capacity === 1 ? "one mentee" : `up to ${capacity} mentees`}; you may change that in your particulars.`
            : " Say how many you will take in your particulars and the House will begin."}
        </EmptyState>
      </div>
    );
  }

  const [snaps, sittings] = await Promise.all([
    Promise.all(seats.map((s) => memberSnapshot(repo, s.profile))),
    repo.listSittings([...new Set(seats.map((s) => s.circle.id))]),
  ]);
  const checkedIn = snaps.filter((s) => s.checkedInThisWeek).length;
  const openTotal = snaps.reduce((n, s) => n + s.openThisWeek, 0);

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Mentoring"
        title="Your mentees"
        lede="Everyone you sit with, and how their week is going."
      />

      <div className="stat-row">
        <Stat value={seats.length} label={seats.length === 1 ? "Mentee" : "Mentees"} sub={profile.mentorCapacity ? `of ${profile.mentorCapacity} you will take` : undefined} />
        <Stat value={checkedIn} label="Checked in" sub="this week" tone={checkedIn === seats.length ? "ok" : "warn"} />
        <Stat value={openTotal} label="Open" sub="commitments this week" />
      </div>

      <div className="card-grid">
        {seats.map((seat, i) => (
          <MenteeCard key={seat.profile.id} seat={seat} snap={snaps[i]} sittings={sittings.filter((s) => s.circleId === seat.circle.id)} />
        ))}
      </div>
    </div>
  );
}

function MenteeCard({ seat, snap, sittings }: { seat: Seat; snap: MemberSnapshot; sittings: Sitting[] }) {
  const { profile } = seat;
  const next = sittings
    .filter((s) => s.status === "scheduled" && new Date(s.scheduledAt).getTime() > Date.now() - 3_600_000)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  const meta = [profile.practiceName, profile.region].filter(Boolean).join(" · ") || "Principal";

  return (
    <Card as="article">
      <Person
        name={profile.fullName}
        meta={meta}
        href={`/mentor/${profile.id}`}
        trailing={<Badge tone={seat.kind === "pair" ? "gold" : ""} dot={false}>{seat.kind === "pair" ? "Mentee" : "In your pod"}</Badge>}
      />

      {snap.block && snap.week ? <WeekStrip current={snap.week} weekStatus={snap.weekStatus} compact /> : null}

      <dl className="facts">
        <div>
          <dt>Block</dt>
          <dd>{snap.block && snap.week ? `${snap.block.title} · week ${snap.week} of ${BLOCK_WEEKS}` : "No block running"}</dd>
        </div>
        <div>
          <dt>Check-in</dt>
          <dd>{snap.checkedInThisWeek ? "This week" : "Not yet"}</dd>
        </div>
        <div>
          <dt>Open</dt>
          <dd>{snap.openThisWeek}</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>{snap.streak} {snap.streak === 1 ? "week" : "weeks"}</dd>
        </div>
        <div>
          <dt>Consistency</dt>
          <dd>{snap.score}</dd>
        </div>
      </dl>

      {snap.latestCheckIn?.didWell ? (
        <blockquote className="excerpt">
          <span className="who">Last check-in · {weekLabel(snap.latestCheckIn.weekKey)}</span>
          {snap.latestCheckIn.didWell}
        </blockquote>
      ) : (
        <Caption>{firstName(profile)} has not checked in yet.</Caption>
      )}

      <Form action={addNote} resetOnSuccess successNotice>
        <input type="hidden" name="about_user_id" value={profile.id} />
        <TextArea label={`A note about ${firstName(profile)}`} name="body" hideLabel rows={2} maxLength={1000} placeholder={`A note about ${firstName(profile)}'s week`} required />
        <div className="form-actions">
          <SubmitButton size="sm" variant="secondary">Leave a note</SubmitButton>
          <TextLink href={`/mentor/${profile.id}`}>The whole record</TextLink>
        </div>
      </Form>

      <Caption>
        {next ? (
          <>
            Next sitting <time dateTime={next.scheduledAt}>{formatAppointment(next.scheduledAt)}</time>, {relativeDays(next.scheduledAt)}.
          </>
        ) : (
          `No sitting is in the diary with ${firstName(profile)}.`
        )}
      </Caption>
    </Card>
  );
}
