import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import {
  CADENCE_LABEL,
  address,
  isMentorIn,
  othersIn,
  visitLedger,
  type CheckIn,
  type CircleWithMembers,
  type Profile,
  type Sitting,
  type Visit,
  type VisitLedger,
} from "@/lib/domain";
import type { Repo } from "@/lib/repo/types";
import { circleTitle, memberSnapshot } from "@/lib/queries";
import { currentWeekKey, formatAppointment, formatDayMonth, formatShortDate, relativeDays, weekLabel } from "@/lib/weeks";
import {
  Avatar, Body, Button, Caption, Card, EmptyState, Eyebrow, H2, H3, HairlineList, HairlineRow, Person, PracticeVisitBadge, RoleBadge, Section, SittingBadge, TextLink, VisitBadge,
} from "@/components/ui";

export const metadata: Metadata = { title: "Your circle" };

export default async function CirclePage() {
  const { profile, repo, userId } = await requireViewer();
  const circles = (await repo.listCirclesFor(userId))
    .filter((c) => c.status === "active")
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "pair" ? -1 : 1));

  if (circles.length === 0) {
    return (
      <div className="section fade-enter">
        <Eyebrow>Your circle</Eyebrow>
        <EmptyState
          title="You are in the queue."
          action={<TextLink href="/settings">Revise your particulars</TextLink>}
        >
          The House is finding you a principal of fitting ambition and hour. It goes on your focus areas, your cadence and the
          times you keep, so it is worth making sure those are right. You will be told the moment a seat is found.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="section fade-enter">
      <Eyebrow>Your circle</Eyebrow>
      {circles.map((circle) => (
        <CircleSection key={circle.id} circle={circle} viewer={profile} repo={repo} />
      ))}
    </div>
  );
}

/* ---------- One circle ---------- */

async function CircleSection({ circle, viewer, repo }: { circle: CircleWithMembers; viewer: Profile; repo: Repo }) {
  const userId = viewer.id;
  const leads = isMentorIn(circle, userId);
  const visible = visibleMemberIds(circle, userId);
  const eyebrow = `${circle.kind === "pair" ? "Your pair" : "Your pod"} · ${CADENCE_LABEL[circle.cadence].toLowerCase()}`;

  const [checkIns, wins, sittings, allVisits] = await Promise.all([
    repo.listCheckInsFor(visible, 100),
    repo.listWinsFor(visible),
    repo.listSittings([circle.id]),
    repo.listVisitsFor(userId),
  ]);
  const visits = allVisits.filter((v) => v.circleId === circle.id);
  const weekKey = currentWeekKey();
  const thisWeek = checkIns.filter((c) => c.weekKey === weekKey);
  const byId = new Map(circle.members.map((m) => [m.userId, m.profile]));

  return (
    <section className="stack gap-6">
      <div className="stack gap-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <H2>{circleTitle(circle, userId)}</H2>
        {leads && <Caption>You lead this circle.</Caption>}
        {circle.kind === "pod" && circle.cohortLabel && <Caption>{circle.members.length} principals · cohort {circle.cohortLabel}</Caption>}
      </div>

      {circle.kind === "pair" ? <PairMember circle={circle} userId={userId} /> : <PodMembers circle={circle} userId={userId} repo={repo} />}

      <Section title="This week in the circle" aside={<Caption>{weekLabel(weekKey)}</Caption>}>
        {thisWeek.length === 0 ? (
          <EmptyState
            title="No check-ins yet this week."
            action={<Button href="/check-in" size="sm" variant="secondary">Check in</Button>}
          >
            {circle.kind === "pod"
              ? "Check-ins from the pod appear here as they come in. Yours can be the first."
              : leads
                ? "Your mentee has not checked in yet this week. It will appear here when they do."
                : `Your check-in appears here, and ${partnerName(circle, userId)} reads it before you sit.`}
          </EmptyState>
        ) : (
          <div className="feed">
            {thisWeek.map((c) => (
              <CheckInItem key={c.id} checkIn={c} who={byId.get(c.userId) ?? null} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Recent wins in the circle" aside={<TextLink href="/wins">Your ledger</TextLink>}>
        {wins.length === 0 ? (
          <EmptyState title="Nothing logged yet.">A win is anything worth remembering at the next sitting. Log one on your ledger.</EmptyState>
        ) : (
          <HairlineList>
            {wins.slice(0, 6).map((w) => (
              <HairlineRow
                key={w.id}
                date={<time dateTime={w.createdAt}>{formatDayMonth(w.createdAt)}</time>}
                title={w.title}
                meta={[byId.get(w.userId)?.fullName ?? "A member", w.detail].filter(Boolean).join(" · ")}
              />
            ))}
          </HairlineList>
        )}
      </Section>

      <Visits visits={visits} circle={circle} userId={userId} />

      <Sittings sittings={sittings} circle={circle} userId={userId} />
    </section>
  );
}

/* ---------- Practice visits ---------- */

/**
 * Every principal spends a morning inside every other practice in the circle,
 * and has each of them inside their own. This is the state of that account.
 */
function Visits({ visits, circle, userId }: { visits: Visit[]; circle: CircleWithMembers; userId: string }) {
  const ledger = visitLedger(circle, visits, userId);
  const total = ledger.visited.length + ledger.toVisit.length;
  if (total === 0) return null;

  const waiting = visits.filter((v) => v.status === "proposed");
  const booked = visits
    .filter((v) => v.status === "agreed" && new Date(v.scheduledAt).getTime() > Date.now() - 3_600_000)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  return (
    <Section title="Practice visits" aside={<TextLink href="/visits">All visits</TextLink>}>
      <Card>
        <Body>{visitSummary(ledger, total)}</Body>
        <Caption>A morning inside someone else&rsquo;s practice, and in turn one inside yours.</Caption>
        <div className="row gap-4 wrap">
          <Button href="/visits#propose" size="sm" variant="secondary">Propose a morning</Button>
          {waiting.length > 0 && <Caption>{waiting.length} {waiting.length === 1 ? "proposal is" : "proposals are"} waiting on an answer.</Caption>}
        </div>
      </Card>

      {booked.length > 0 && (
        <HairlineList>
          {booked.map((v) => (
            <HairlineRow
              key={v.id}
              href={`/visits/${v.id}`}
              date={<time dateTime={v.scheduledAt}>{formatShortDate(v.scheduledAt)}</time>}
              title={v.hostId === userId ? "Your practice" : v.practiceName ?? "A practice"}
              meta={`${formatAppointment(v.scheduledAt)} · ${v.hostId === userId ? "they come to you" : "you go to them"}`}
              right={
                <span className="badge-row">
                  <PracticeVisitBadge />
                  <VisitBadge status={v.status} />
                </span>
              }
            />
          ))}
        </HairlineList>
      )}

      <div className="grid-even">
        <div className="stack gap-3">
          <Eyebrow>Practices you have been inside</Eyebrow>
          {ledger.visited.length === 0 ? (
            <Caption>None yet. The first one changes how you read your own.</Caption>
          ) : (
            <HairlineList>
              {ledger.visited.map(({ profile, at, visitId }) => (
                <HairlineRow
                  key={profile.id}
                  href={`/visits/${visitId}`}
                  date={<time dateTime={at}>{formatDayMonth(at)}</time>}
                  title={profile.fullName}
                  meta={profile.practiceName ?? "Principal"}
                />
              ))}
            </HairlineList>
          )}
          {ledger.toVisit.length > 0 && <Caption>Still to see: {ledger.toVisit.map((p) => p.fullName).join(", ")}.</Caption>}
        </div>
        <div className="stack gap-3">
          <Eyebrow>Principals who have been inside yours</Eyebrow>
          {ledger.hosted.length === 0 ? (
            <Caption>Nobody yet. Open a morning and the circle will come.</Caption>
          ) : (
            <HairlineList>
              {ledger.hosted.map(({ profile, at, visitId }) => (
                <HairlineRow
                  key={profile.id}
                  href={`/visits/${visitId}`}
                  date={<time dateTime={at}>{formatDayMonth(at)}</time>}
                  title={profile.fullName}
                  meta={profile.practiceName ?? "Principal"}
                />
              ))}
            </HairlineList>
          )}
          {ledger.toHost.length > 0 && <Caption>Still to see yours: {ledger.toHost.map((p) => p.fullName).join(", ")}.</Caption>}
        </div>
      </div>
    </Section>
  );
}

/** "You have visited two of the five. Three practices to go, and two principals still to see yours." */
function visitSummary(ledger: VisitLedger, total: number): string {
  const seen = ledger.visited.length;
  const toVisit = ledger.toVisit.length;
  const toHost = ledger.toHost.length;

  // A pair reads as two people, not as an account of practices.
  if (total === 1) {
    if (seen === 1 && toHost === 0) return "You have been inside their practice, and they have been inside yours. The account is settled.";
    if (seen === 1) return "You have been inside their practice. They have not yet been inside yours.";
    if (toHost === 0) return "They have been inside your practice. You have not yet been inside theirs.";
    return "Neither of you has yet spent a morning in the other's practice.";
  }

  const first =
    seen === 0
      ? `You have not yet been inside any of the ${count(total)}.`
      : seen === total
        ? `You have been inside all ${count(total)} practices.`
        : `You have visited ${count(seen)} of the ${count(total)}.`;
  const second =
    toVisit === 0 && toHost === 0
      ? "The account is settled, both ways."
      : toVisit === 0
        ? `Every practice seen, and ${count(toHost)} ${toHost === 1 ? "principal" : "principals"} still to see yours.`
        : toHost === 0
          ? `${capitalise(count(toVisit))} ${toVisit === 1 ? "practice" : "practices"} to go, and everyone has seen yours.`
          : `${capitalise(count(toVisit))} ${toVisit === 1 ? "practice" : "practices"} to go, and ${count(toHost)} ${toHost === 1 ? "principal" : "principals"} still to see yours.`;
  return `${first} ${second}`;
}

const NUMBERS = ["none", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
function count(n: number): string {
  return NUMBERS[n] ?? String(n);
}
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- Members ---------- */

function PairMember({ circle, userId }: { circle: CircleWithMembers; userId: string }) {
  const other = othersIn(circle, userId)[0];
  if (!other) {
    return <EmptyState title="Your partner has not yet taken their seat.">The House will introduce you when they do.</EmptyState>;
  }
  const p = other.profile;
  const meta = [p.practiceName, p.region].filter(Boolean).join(" · ");
  return (
    <Card>
      <Person name={p.fullName} size="lg" meta={meta || "Principal"} trailing={<RoleBadge role={other.role} />} />
      {p.yearsAsPrincipal != null && p.yearsAsPrincipal > 0 && (
        <Caption>{p.yearsAsPrincipal} {p.yearsAsPrincipal === 1 ? "year" : "years"} a principal{p.chairCount ? ` · ${p.chairCount} chairs` : ""}</Caption>
      )}
      {p.bio && <Body>{p.bio}</Body>}
      {other.role === "mentor" && p.mentorNote && (
        <blockquote className="quote">
          {p.mentorNote}
          <cite>{address(p)} on how they mentor</cite>
        </blockquote>
      )}
      <div className="row gap-4 wrap">
        <Button href={`/messages?circle=${circle.id}`} size="sm">Write a note</Button>
        <Button href="/calendar" size="sm" variant="secondary">Next sitting</Button>
      </div>
    </Card>
  );
}

async function PodMembers({ circle, userId, repo }: { circle: CircleWithMembers; userId: string; repo: Repo }) {
  const others = othersIn(circle, userId);
  const snaps = await Promise.all(others.map((m) => memberSnapshot(repo, m.profile)));
  return (
    <div className="card-grid">
      {others.map((m, i) => {
        const s = snaps[i];
        const open = s.openThisWeek;
        return (
          <Card key={m.userId} pad="sm">
            <Person name={m.profile.fullName} size="sm" meta={m.profile.practiceName ?? "Principal"} trailing={<RoleBadge role={m.role} />} />
            <Caption>
              {s.checkedInThisWeek ? "Checked in this week" : "Not yet checked in"} ·{" "}
              {s.block ? `${open} open ${open === 1 ? "commitment" : "commitments"}` : "no block running"}
            </Caption>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Feed ---------- */

function CheckInItem({ checkIn, who }: { checkIn: CheckIn; who: Profile | null }) {
  const name = who?.fullName ?? "A member";
  return (
    <article className="feed-item">
      <Avatar name={name} size="sm" />
      <div>
        <div className="feed-head">
          <span className="feed-who">{name}</span>
          <time className="feed-when" dateTime={checkIn.completedAt}>{weekLabel(checkIn.weekKey)}</time>
        </div>
        <div className="feed-body">
          <dl>
            {checkIn.didWell && (<><dt>Went well</dt><dd>{checkIn.didWell}</dd></>)}
            {checkIn.nextFocus && (<><dt>Next focus</dt><dd>{checkIn.nextFocus}</dd></>)}
            {checkIn.energy != null && (<><dt>Energy</dt><dd>{checkIn.energy} of 10</dd></>)}
          </dl>
        </div>
      </div>
    </article>
  );
}

/* ---------- Sittings ---------- */

function Sittings({ sittings, circle, userId }: { sittings: Sitting[]; circle: CircleWithMembers; userId: string }) {
  // Practice visits keep their own block above; this is the circle's standing hour.
  const now = Date.now();
  const upcoming = sittings
    .filter((s) => s.status === "scheduled" && new Date(s.scheduledAt).getTime() > now - 3_600_000)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const next = upcoming[0] ?? null;
  const past = sittings
    .filter((s) => s.id !== next?.id && !upcoming.some((u) => u.id === s.id))
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const later = upcoming.slice(1);

  return (
    <Section title="Sittings" aside={<TextLink href="/calendar">The diary</TextLink>}>
      {next ? (
        <Card emphasis>
          <Eyebrow>Next sitting</Eyebrow>
          <H3><time dateTime={next.scheduledAt}>{formatAppointment(next.scheduledAt)}</time></H3>
          <Caption>{relativeDays(next.scheduledAt)} · {circleTitle(circle, userId)}</Caption>
          <div className="row gap-4 wrap">
            <Button href={`/sittings/${next.id}`} size="sm">Prepare</Button>
            {next.joinUrl && <Button href={next.joinUrl} external size="sm" variant="secondary">Join</Button>}
          </div>
        </Card>
      ) : (
        <EmptyState title="No sitting in the diary." action={<Button href="/calendar" size="sm" variant="secondary">Arrange a sitting</Button>}>
          A standing time is the whole point. Hold the next one now and the circle will see it.
        </EmptyState>
      )}

      {(later.length > 0 || past.length > 0) && (
        <HairlineList>
          {[...later, ...past].map((s) => (
            <HairlineRow
              key={s.id}
              href={`/sittings/${s.id}`}
              date={<time dateTime={s.scheduledAt}>{formatShortDate(s.scheduledAt)}</time>}
              title={formatAppointment(s.scheduledAt)}
              meta={s.notes ? excerpt(s.notes, 140) : s.status === "scheduled" ? "Not yet held." : "No notes were kept."}
              right={<SittingBadge status={s.status} />}
            />
          ))}
        </HairlineList>
      )}
    </Section>
  );
}

/* ---------- Helpers ---------- */

/** Whose check-ins and wins the viewer may see in this circle. */
function visibleMemberIds(circle: CircleWithMembers, userId: string): string[] {
  if (circle.kind === "pod") return circle.members.map((m) => m.userId);
  if (isMentorIn(circle, userId)) return circle.members.map((m) => m.userId);
  return [userId];
}

function partnerName(circle: CircleWithMembers, userId: string): string {
  const other = othersIn(circle, userId)[0]?.profile;
  return other ? address(other) : "your partner";
}

function excerpt(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}
