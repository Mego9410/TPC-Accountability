import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { addDays, addMonths, addWeeks, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { requireViewer } from "@/lib/session";
import { CADENCE_LABEL, address, type Cadence, type CircleWithMembers, type Profile, type Sitting } from "@/lib/domain";
import { circleTitle } from "@/lib/queries";
import { formatAppointment, formatShortDate, relativeDays } from "@/lib/weeks";
import {
  Button, Caption, Card, EmptyState, Eyebrow, H2, H3, HairlineList, HairlineRow, PageHeader, PracticeVisitBadge,
  Section, SittingBadge, TextLink, VisitBadge,
} from "@/components/ui";
import { Form, SubmitButton, FField as Field, FSelect as Select } from "@/components/ui/form";
import { scheduleSitting } from "@/lib/actions/sittings";

export const metadata: Metadata = { title: "Sittings" };

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** One line in the diary: a sitting over video, or a morning in a practice. */
interface Entry {
  id: string;
  at: string;
  href: string;
  title: string;
  meta: string;
  /** The pip in the month grid: quiet for what is done, struck through for what is off. */
  tone: "" | "held" | "cancelled" | "visit";
  badge: ReactNode;
  upcoming: boolean;
  label: string;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { repo, userId } = await requireViewer();
  const { month } = await searchParams;
  const circles = (await repo.listCirclesFor(userId)).filter((c) => c.status === "active");
  const [sittings, visits] = await Promise.all([
    repo.listSittings(circles.map((c) => c.id)),
    repo.listVisitsFor(userId),
  ]);
  const titleOf = (circleId: string) => {
    const c = circles.find((x) => x.id === circleId);
    return c ? circleTitle(c, userId) : "A circle";
  };

  const people = new Map<string, Profile>();
  for (const c of circles) for (const m of c.members) people.set(m.userId, m.profile);
  const addressOf = (id: string) => {
    const p = people.get(id);
    return p ? address(p) : "another principal";
  };

  const today = new Date();
  const shown = parseMonth(month) ?? startOfMonth(today);
  const now = today.getTime();

  const entries: Entry[] = [
    ...sittings.map((s): Entry => ({
      id: s.id,
      at: s.scheduledAt,
      href: `/sittings/${s.id}`,
      title: titleOf(s.circleId),
      meta: [formatAppointment(s.scheduledAt), s.notes ? excerpt(s.notes, 100) : null].filter(Boolean).join(" · "),
      tone: s.status === "completed" ? "held" : s.status === "cancelled" ? "cancelled" : "",
      badge: <SittingBadge status={s.status} />,
      upcoming: s.status === "scheduled" && new Date(s.scheduledAt).getTime() > now - 3_600_000,
      label: "Sitting",
    })),
    ...visits
      .filter((v) => v.status === "agreed" || v.status === "held")
      .map((v): Entry => ({
        id: v.id,
        at: v.scheduledAt,
        href: `/visits/${v.id}`,
        title: v.hostId === userId ? "Your practice" : v.practiceName ?? addressOf(v.hostId),
        meta: [
          formatAppointment(v.scheduledAt),
          v.hostId === userId ? `${addressOf(v.visitorId)} comes to you` : `You go to ${addressOf(v.hostId)}`,
        ].join(" · "),
        tone: v.status === "held" ? "held" : "visit",
        badge: (
          <span className="badge-row">
            <PracticeVisitBadge />
            <VisitBadge status={v.status} />
          </span>
        ),
        upcoming: v.status === "agreed" && new Date(v.scheduledAt).getTime() > now - 3_600_000,
        label: "Practice visit",
      })),
  ];

  const upcoming = entries.filter((e) => e.upcoming).sort((a, b) => a.at.localeCompare(b.at));
  const past = entries.filter((e) => !e.upcoming).sort((a, b) => b.at.localeCompare(a.at));
  const next = upcoming[0] ?? null;

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="The diary"
        title="Sittings and mornings."
        lede="Every sitting and every agreed practice visit across your circles, and the place to arrange the next one."
        actions={<Button href="/visits#propose" variant="secondary">Propose a morning</Button>}
      />

      <div className="grid-cal">
        <div className="stack gap-6">
          <MonthGrid shown={shown} today={today} entries={entries} />

          <Section title="Upcoming">
            {upcoming.length === 0 ? (
              <EmptyState
                title="Nothing in the diary."
                action={circles.length > 0 ? <Button href="#arrange" size="sm" variant="secondary">Arrange a sitting</Button> : undefined}
              >
                {circles.length === 0
                  ? "Sittings and visits appear here once you are seated in a circle."
                  : "Hold the next sitting, or propose a morning in a practice, and it will appear here."}
              </EmptyState>
            ) : (
              <HairlineList>
                {upcoming.map((e) => <EntryRow key={e.href} entry={e} />)}
              </HairlineList>
            )}
          </Section>

          <Section title="Past">
            {past.length === 0 ? (
              <EmptyState title="Nothing has been held yet.">Once a sitting is marked as held, or a morning recorded, it lives here.</EmptyState>
            ) : (
              <HairlineList>
                {past.slice(0, 12).map((e) => <EntryRow key={e.href} entry={e} />)}
              </HairlineList>
            )}
          </Section>
        </div>

        <div className="stack gap-6">
          <Card emphasis={Boolean(next)}>
            <Eyebrow>{next ? `Next · ${next.label.toLowerCase()}` : "Nothing in the diary"}</Eyebrow>
            {next ? (
              <>
                <H3><time dateTime={next.at}>{formatAppointment(next.at)}</time></H3>
                <Caption>{relativeDays(next.at)} · {next.title}</Caption>
                <div className="row gap-4 wrap">
                  <Button href={next.href} size="sm">Prepare</Button>
                </div>
              </>
            ) : (
              <>
                <H3>Arrange your next sitting.</H3>
                <Caption>A standing time is the whole point.</Caption>
              </>
            )}
          </Card>

          <Card id="arrange">
            <Eyebrow>Arrange a sitting</Eyebrow>
            {circles.length === 0 ? (
              <EmptyState title="You are not yet in a circle.">The House will seat you first; sittings follow.</EmptyState>
            ) : (
              <ArrangeForm circles={circles} sittings={sittings} userId={userId} />
            )}
          </Card>

          <Card>
            <Eyebrow>Practice visits</Eyebrow>
            <H3>A morning is arranged between two principals.</H3>
            <Caption>Either of you may propose one, and the other may decline without giving a reason.</Caption>
            <div className="row gap-4 wrap">
              <Button href="/visits" size="sm" variant="secondary">Practice visits</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Month grid ---------- */

function MonthGrid({ shown, today, entries }: { shown: Date; today: Date; entries: Entry[] }) {
  const first = startOfWeek(startOfMonth(shown), { weekStartsOn: 1 });
  const last = endOfMonth(shown);
  const cells: Date[] = [];
  for (let d = first; d <= last || cells.length % 7 !== 0; d = addDays(d, 1)) cells.push(d);
  const prev = format(addMonths(shown, -1), "yyyy-MM");
  const nextM = format(addMonths(shown, 1), "yyyy-MM");

  return (
    <div className="stack gap-4">
      <div className="cal-nav">
        <TextLink href={`/calendar?month=${prev}`} back>{format(addMonths(shown, -1), "MMMM")}</TextLink>
        <H2><time dateTime={format(shown, "yyyy-MM")}>{format(shown, "MMMM yyyy")}</time></H2>
        <TextLink href={`/calendar?month=${nextM}`}>{format(addMonths(shown, 1), "MMMM")} →</TextLink>
      </div>
      <div className="cal static">
        {DOW.map((d) => (
          <div key={d} className="head" aria-hidden="true">{d}</div>
        ))}
        {cells.map((d) => {
          const isToday = isSameDay(d, today);
          const onThisDay = entries.filter((e) => isSameDay(new Date(e.at), d));
          return (
            <div
              key={d.toISOString()}
              className={["day", !isSameMonth(d, shown) && "muted", isToday && "selected today"].filter(Boolean).join(" ")}
              aria-current={isToday ? "date" : undefined}
            >
              <time className="n" dateTime={format(d, "yyyy-MM-dd")} aria-label={format(d, "EEEE d MMMM")}>{format(d, "d")}</time>
              {onThisDay.map((e) => (
                <Link key={e.href} href={e.href} className={`ev ${e.tone}`} title={`${e.label} · ${formatAppointment(e.at)} · ${e.title}`}>
                  <span className="d" aria-hidden="true" />
                  <span className="t">{format(new Date(e.at), "h:mm a").toLowerCase()} {e.title}</span>
                </Link>
              ))}
            </div>
          );
        })}
      </div>
      {!isSameMonth(shown, today) && <TextLink href="/calendar">This month</TextLink>}
    </div>
  );
}

/* ---------- Arrange ---------- */

function ArrangeForm({ circles, sittings, userId }: { circles: CircleWithMembers[]; sittings: Sitting[]; userId: string }) {
  const firstCircle = circles[0];
  const suggested = suggestNext(firstCircle, sittings.filter((s) => s.circleId === firstCircle.id));
  return (
    <Form action={scheduleSitting}>
      <Select
        label="Circle"
        name="circle_id"
        options={circles.map((c) => ({ value: c.id, label: `${circleTitle(c, userId)} · ${CADENCE_LABEL[c.cadence].toLowerCase()}` }))}
      />
      <Field
        label="Date and time"
        name="scheduled_at"
        type="datetime-local"
        defaultValue={suggested}
        required
        help={`Suggested from the ${CADENCE_LABEL[firstCircle.cadence].toLowerCase()} rhythm of ${circleTitle(firstCircle, userId)}.`}
      />
      <Field
        label="Meeting link"
        name="join_url"
        type="url"
        inputMode="url"
        placeholder="https://"
        help="Google Meet, Teams or Zoom link. Optional."
      />
      <div className="form-actions">
        <SubmitButton>Put it in the diary</SubmitButton>
      </div>
    </Form>
  );
}

/** The next slot on the circle's cadence, at half past six in the evening. */
function suggestNext(circle: CircleWithMembers, sittings: Sitting[]): string {
  const weeks: Record<Cadence, number> = { weekly: 1, fortnightly: 2, monthly: 4 };
  const latest = sittings
    .filter((s) => s.status !== "cancelled")
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0];
  const now = new Date();
  let candidate = latest ? addWeeks(new Date(latest.scheduledAt), weeks[circle.cadence]) : addWeeks(now, 1);
  while (candidate.getTime() < now.getTime() + 3_600_000) candidate = addWeeks(candidate, weeks[circle.cadence]);
  candidate.setHours(18, 30, 0, 0);
  return format(candidate, "yyyy-MM-dd'T'HH:mm");
}

/* ---------- Rows ---------- */

function EntryRow({ entry }: { entry: Entry }) {
  return (
    <HairlineRow
      href={entry.href}
      date={<time dateTime={entry.at}>{formatShortDate(entry.at)}</time>}
      title={entry.title}
      meta={entry.meta}
      right={entry.badge}
    />
  );
}

function parseMonth(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : startOfMonth(d);
}

function excerpt(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}
