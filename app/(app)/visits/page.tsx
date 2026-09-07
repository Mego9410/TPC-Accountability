import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import {
  VISITS_A_YEAR,
  awaitingAnswerFrom,
  otherPartyOfVisit,
  visitsThisYear,
  type Profile,
  type Visit,
} from "@/lib/domain";
import { answerVisit, markVisitHeld } from "@/lib/actions/visits";
import { formatAppointment, formatShortDate, relativeDays } from "@/lib/weeks";
import {
  Body, Button, Caption, Card, EmptyState, H3, HairlineList, HairlineRow, Notice, PageHeader, Person, Section,
  TextLink, VisitBadge,
} from "@/components/ui";
import { QuickAction } from "@/components/ui/form";

export const metadata: Metadata = { title: "Companion visits" };

export default async function VisitsPage() {
  const { repo, userId } = await requireViewer();
  const visits = await repo.listVisitsFor(userId);

  const ids = [...new Set(visits.map((v) => otherPartyOfVisit(v, userId)))];
  const people = new Map<string, Profile>((await repo.listProfiles(ids)).map((p) => [p.id, p]));
  const nameOf = (v: Visit) => people.get(otherPartyOfVisit(v, userId))?.fullName ?? "A principal";

  const now = Date.now();
  const waitingOnYou = visits.filter((v) => awaitingAnswerFrom(v, userId));
  const waitingOnThem = visits.filter((v) => v.status === "proposed" && v.proposedById === userId);
  const diary = visits.filter((v) => v.status === "agreed").sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const held = visits.filter((v) => v.status === "held").sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  const used = visitsThisYear(visits, userId);
  const left = Math.max(0, VISITS_A_YEAR - used);

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Companion visits"
        title="A morning inside another practice."
        lede="The workflow, the systems, the processes, the feel of the place. You are host as often as you are visitor, and either of you may decline without giving a reason."
        actions={<Button href="/visits/new">Propose a morning</Button>}
      />

      <Notice tone={left === 0 ? "warn" : "info"}>
        {used} of {VISITS_A_YEAR} held in the last twelve months.{" "}
        {left === 0
          ? "That is the ceiling. It frees up twelve months after the first of them."
          : `${left === 1 ? "One" : "Two"} left to you.`}
      </Notice>

      {waitingOnYou.length > 0 && (
        <Section title="Waiting on you">
          <div className="stack gap-5">
            {waitingOnYou.map((v) => (
              <Card key={v.id} emphasis>
                <div className="row between wrap gap-4">
                  <Person
                    name={nameOf(v)}
                    size="lg"
                    meta={v.hostId === userId ? "Would come to your practice" : v.practiceName ?? "Their practice"}
                    href={`/visits/${v.id}`}
                  />
                  <VisitBadge status={v.status} />
                </div>
                <H3>
                  <time dateTime={v.scheduledAt}>{formatAppointment(v.scheduledAt)}</time>
                </H3>
                <Caption>{relativeDays(v.scheduledAt)}</Caption>
                {v.proposalNote && <blockquote className="quote">{v.proposalNote}</blockquote>}
                <div className="row wrap gap-3">
                  <QuickAction action={answerVisit} fields={{ visit_id: v.id, answer: "agree" }} variant="primary">
                    Agree to the morning
                  </QuickAction>
                  <QuickAction
                    action={answerVisit}
                    fields={{ visit_id: v.id, answer: "decline" }}
                    confirm="Decline this morning? No reason is owed, and none is recorded."
                  >
                    Decline
                  </QuickAction>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {waitingOnThem.length > 0 && (
        <Section title="Waiting on them" aside={<Caption>They may decline, and owe you no reason.</Caption>}>
          <HairlineList>
            {waitingOnThem.map((v) => (
              <HairlineRow
                key={v.id}
                href={`/visits/${v.id}`}
                date={<time dateTime={v.scheduledAt}>{formatShortDate(v.scheduledAt)}</time>}
                title={nameOf(v)}
                meta={`${v.hostId === userId ? "You offered to host" : `You asked to visit ${v.practiceName ?? "their practice"}`} · ${formatAppointment(v.scheduledAt)}`}
                right={<VisitBadge status={v.status} />}
              />
            ))}
          </HairlineList>
        </Section>
      )}

      <Section title="In the diary">
        {diary.length === 0 ? (
          <EmptyState title="No morning is arranged." action={<Button href="/visits/new">Propose a morning</Button>}>
            Nothing agreed either way at the moment.
          </EmptyState>
        ) : (
          <div className="stack gap-5">
            {diary.map((v) => {
              const past = new Date(v.scheduledAt).getTime() < now;
              return (
                <Card key={v.id}>
                  <div className="row between wrap gap-4">
                    <Person
                      name={nameOf(v)}
                      size="lg"
                      meta={v.hostId === userId ? "Coming to your practice" : v.practiceName ?? "Their practice"}
                      href={`/visits/${v.id}`}
                    />
                    <VisitBadge status={v.status} />
                  </div>
                  <H3>
                    <time dateTime={v.scheduledAt}>{formatAppointment(v.scheduledAt)}</time>
                  </H3>
                  <Caption>
                    {relativeDays(v.scheduledAt)} · {v.hostId === userId ? "You are the host" : "You are the visitor"}
                  </Caption>
                  {v.arrivalNote ? (
                    <Body className="muted">{v.arrivalNote}</Body>
                  ) : v.hostId === userId ? (
                    <Caption>You have not written the arrival note yet.</Caption>
                  ) : (
                    <Caption>The host has not written the arrival note yet.</Caption>
                  )}
                  <div className="row wrap gap-3">
                    <Button href={`/visits/${v.id}`} variant="secondary" size="sm">The morning</Button>
                    {past && (
                      <QuickAction action={markVisitHeld} fields={{ visit_id: v.id }} variant="primary">
                        Record it as held
                      </QuickAction>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Held" aside={<TextLink href="/visits/new">Propose another</TextLink>}>
        {held.length === 0 ? (
          <EmptyState title="No morning has been held yet.">
            Once one has happened, what you both made of it is written down here.
          </EmptyState>
        ) : (
          <div className="stack gap-5">
            {held.map((v) => (
              <Card key={v.id}>
                <div className="row between wrap gap-4">
                  <Person
                    name={nameOf(v)}
                    size="md"
                    meta={`${v.practiceName ?? "Their practice"} · ${formatShortDate(v.scheduledAt)}`}
                    href={`/visits/${v.id}`}
                  />
                  <VisitBadge status={v.status} />
                </div>
                {v.notes ? (
                  <p className="prose-note">{v.notes}</p>
                ) : (
                  <Caption>Nothing written down yet. Both of you may add to it.</Caption>
                )}
                <div className="row wrap gap-3">
                  <Button href={`/visits/${v.id}`} variant="quiet" size="sm">The record</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
