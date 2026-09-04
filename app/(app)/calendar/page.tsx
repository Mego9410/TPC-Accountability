import type { Metadata } from "next";
import Link from "next/link";
import { addDays, addMonths, addWeeks, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { requireViewer } from "@/lib/session";
import { CADENCE_LABEL, type Cadence, type CircleWithMembers, type Sitting } from "@/lib/domain";
import { circleTitle, nextSitting } from "@/lib/queries";
import { formatAppointment, formatShortDate, relativeDays } from "@/lib/weeks";
import {
  Button, Caption, Card, EmptyState, Eyebrow, H2, H3, HairlineList, HairlineRow, PageHeader, Section, Select, Field, SittingBadge, TextLink,
} from "@/components/ui";
import { Form, SubmitButton } from "@/components/ui/form";
import { scheduleSitting } from "@/lib/actions/sittings";

export const metadata: Metadata = { title: "Sittings" };

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { repo, userId } = await requireViewer();
  const { month } = await searchParams;
  const circles = (await repo.listCirclesFor(userId)).filter((c) => c.status === "active");
  const [sittings, next] = await Promise.all([repo.listSittings(circles.map((c) => c.id)), nextSitting(repo, circles)]);
  const titleOf = (circleId: string) => {
    const c = circles.find((x) => x.id === circleId);
    return c ? circleTitle(c, userId) : "A circle";
  };

  const today = new Date();
  const shown = parseMonth(month) ?? startOfMonth(today);
  const now = today.getTime();
  const upcoming = sittings
    .filter((s) => s.status === "scheduled" && new Date(s.scheduledAt).getTime() > now - 3_600_000)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const past = sittings
    .filter((s) => !upcoming.some((u) => u.id === s.id))
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Sittings"
        title="The diary."
        lede="Every sitting across your circles, and the place to hold the next one."
      />

      <div className="grid-cal">
        <div className="stack gap-6">
          <MonthGrid shown={shown} today={today} sittings={sittings} titleOf={titleOf} />

          <Section title="Upcoming">
            {upcoming.length === 0 ? (
              <EmptyState title="Nothing in the diary.">
                {circles.length === 0 ? "Sittings appear here once you are seated in a circle." : "Hold the next sitting and it will appear here."}
              </EmptyState>
            ) : (
              <HairlineList>
                {upcoming.map((s) => (
                  <SittingRow key={s.id} sitting={s} title={titleOf(s.circleId)} />
                ))}
              </HairlineList>
            )}
          </Section>

          <Section title="Past">
            {past.length === 0 ? (
              <EmptyState title="No sitting has been held yet.">Once one is marked as held, its notes live here.</EmptyState>
            ) : (
              <HairlineList>
                {past.slice(0, 12).map((s) => (
                  <SittingRow key={s.id} sitting={s} title={titleOf(s.circleId)} />
                ))}
              </HairlineList>
            )}
          </Section>
        </div>

        <div className="stack gap-6">
          <Card emphasis={Boolean(next)}>
            <Eyebrow>{next ? "Next" : "No sitting held"}</Eyebrow>
            {next ? (
              <>
                <H3><time dateTime={next.sitting.scheduledAt}>{formatAppointment(next.sitting.scheduledAt)}</time></H3>
                <Caption>{relativeDays(next.sitting.scheduledAt)} · {circleTitle(next.circle, userId)}</Caption>
                <div className="row gap-4 wrap">
                  <Button href={`/sittings/${next.sitting.id}`} size="sm">Prepare</Button>
                  {next.sitting.joinUrl && <Button href={next.sitting.joinUrl} external size="sm" variant="secondary">Join</Button>}
                </div>
              </>
            ) : (
              <>
                <H3>Arrange your next sitting.</H3>
                <Caption>A standing time is the whole point.</Caption>
              </>
            )}
          </Card>

          <Card>
            <Eyebrow>Arrange a sitting</Eyebrow>
            {circles.length === 0 ? (
              <EmptyState title="You are not yet in a circle.">The House will seat you first; sittings follow.</EmptyState>
            ) : (
              <ArrangeForm circles={circles} sittings={sittings} userId={userId} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Month grid ---------- */

function MonthGrid({ shown, today, sittings, titleOf }: { shown: Date; today: Date; sittings: Sitting[]; titleOf: (circleId: string) => string }) {
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
          const events = sittings.filter((s) => isSameDay(new Date(s.scheduledAt), d));
          return (
            <div
              key={d.toISOString()}
              className={["day", !isSameMonth(d, shown) && "muted", isToday && "selected today"].filter(Boolean).join(" ")}
              aria-current={isToday ? "date" : undefined}
            >
              <time className="n" dateTime={format(d, "yyyy-MM-dd")} aria-label={format(d, "EEEE d MMMM")}>{format(d, "d")}</time>
              {events.map((s) => (
                <Link key={s.id} href={`/sittings/${s.id}`} className={`ev ${s.status === "completed" ? "held" : s.status}`} title={`${formatAppointment(s.scheduledAt)} · ${titleOf(s.circleId)}`}>
                  <span className="d" aria-hidden="true" />
                  <span className="t">{format(new Date(s.scheduledAt), "h:mm a").toLowerCase()} {titleOf(s.circleId)}</span>
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
      {(state) => (
        <>
          <Select
            label="Circle"
            name="circle_id"
            options={circles.map((c) => ({ value: c.id, label: `${circleTitle(c, userId)} · ${CADENCE_LABEL[c.cadence].toLowerCase()}` }))}
            error={state.errors.circle_id}
          />
          <Field
            label="Date and time"
            name="scheduled_at"
            type="datetime-local"
            defaultValue={suggested}
            required
            help={`Suggested from the ${CADENCE_LABEL[firstCircle.cadence].toLowerCase()} rhythm of ${circleTitle(firstCircle, userId)}.`}
            error={state.errors.scheduled_at}
          />
          <Field
            label="Meeting link"
            name="join_url"
            type="url"
            inputMode="url"
            placeholder="https://"
            help="Google Meet, Teams or Zoom link. Optional."
            error={state.errors.join_url}
          />
          <div className="form-actions">
            <SubmitButton>Hold the sitting</SubmitButton>
          </div>
        </>
      )}
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

function SittingRow({ sitting, title }: { sitting: Sitting; title: string }) {
  return (
    <HairlineRow
      href={`/sittings/${sitting.id}`}
      date={<time dateTime={sitting.scheduledAt}>{formatShortDate(sitting.scheduledAt)}</time>}
      title={title}
      meta={`${formatAppointment(sitting.scheduledAt)}${sitting.notes ? ` · ${excerpt(sitting.notes, 100)}` : ""}`}
      right={<SittingBadge status={sitting.status} />}
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
