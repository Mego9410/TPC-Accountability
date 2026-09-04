import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import {
  address,
  awaitingResponseFrom,
  otherPartyId,
  visitLedger,
  type CircleWithMembers,
  type Profile,
  type Visit,
  type VisitLedger,
  type VisitNote,
} from "@/lib/domain";
import { circleTitle } from "@/lib/queries";
import { formatAppointment, formatDayMonth, formatShortDate, relativeDays } from "@/lib/weeks";
import { markVisitHeld, proposeVisit } from "@/lib/actions/visits";
import {
  Body, Button, Caption, Card, Divider, EmptyState, Eyebrow, H3, HairlineList, HairlineRow, Notice,
  PageHeader, Person, Section, TextLink, VisitBadge,
} from "@/components/ui";
import { Form, QuickAction, SubmitButton, FField as Field, FSelect as Select, FTextArea as TextArea, FieldError } from "@/components/ui/form";
import { RespondToVisit, UNDERTAKING, defaultMorning, visitLine } from "@/components/visits";

export const metadata: Metadata = { title: "Practice visits" };

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string; circle?: string }>;
}) {
  const { repo, userId } = await requireViewer();
  const { with: withWhom, circle: withCircle } = await searchParams;

  const circles = (await repo.listCirclesFor(userId)).filter((c) => c.status === "active");
  const visits = await repo.listVisitsFor(userId);

  const people = new Map<string, Profile>();
  for (const c of circles) for (const m of c.members) people.set(m.userId, m.profile);
  const missing = [...new Set(visits.map((v) => otherPartyId(v, userId)))].filter((id) => !people.has(id));
  for (const p of await repo.listProfiles(missing)) people.set(p.id, p);
  const nameOf = (id: string) => people.get(id)?.fullName ?? "A principal";
  const addressOf = (id: string) => {
    const p = people.get(id);
    return p ? address(p) : "the other principal";
  };

  const now = Date.now();
  const waitingOnYou = visits.filter((v) => awaitingResponseFrom(v, userId));
  const waitingOnThem = visits.filter((v) => v.status === "proposed" && v.proposedById === userId);
  const inTheDiary = visits
    .filter((v) => v.status === "agreed")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const held = visits
    .filter((v) => v.status === "held")
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const notes = held.length > 0 ? await repo.listVisitNotes(held.map((v) => v.id)) : [];

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Practice visits"
        title="A morning inside another practice."
        lede="Either of you may propose one. The other agrees or declines, and may decline without giving a reason. Both give the undertaking before it is agreed, and both write it up afterwards."
        actions={<Button href="#propose">Propose a morning</Button>}
      />

      {waitingOnYou.length > 0 && (
        <Section title="Waiting on you">
          <div className="stack gap-5">
            {waitingOnYou.map((v) => (
              <Card key={v.id} emphasis>
                <div className="row between wrap gap-4">
                  <Person
                    name={nameOf(otherPartyId(v, userId))}
                    size="lg"
                    meta={v.hostId === userId ? "Would come to your practice" : v.practiceName ?? "Their practice"}
                    href={`/visits/${v.id}`}
                  />
                  <VisitBadge status={v.status} />
                </div>
                <H3><time dateTime={v.scheduledAt}>{formatAppointment(v.scheduledAt)}</time></H3>
                <Caption>{relativeDays(v.scheduledAt)} · {visitLine(v, userId, people.get(otherPartyId(v, userId)) ?? null)}</Caption>
                {v.proposalNote && (
                  <blockquote className="quote">
                    {v.proposalNote}
                    <cite>{addressOf(v.proposedById)} on the morning</cite>
                  </blockquote>
                )}
                <RespondToVisit visitId={v.id} proposerName={addressOf(v.proposedById)} />
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
                title={addressOf(otherPartyId(v, userId))}
                meta={`${v.hostId === userId ? "You offered to host" : `You asked to visit ${v.practiceName ?? "their practice"}`} · ${formatAppointment(v.scheduledAt)}`}
                right={<VisitBadge status={v.status} />}
              />
            ))}
          </HairlineList>
        </Section>
      )}

      {inTheDiary.length > 0 && (
        <Section title="In the diary" aside={<TextLink href="/calendar">The whole diary</TextLink>}>
          <div className="stack gap-5">
            {inTheDiary.map((v) => {
              const past = new Date(v.scheduledAt).getTime() < now;
              return (
                <Card key={v.id}>
                  <div className="row between wrap gap-4">
                    <div className="stack gap-2">
                      <Eyebrow>{v.hostId === userId ? "You are the host" : "You are the visitor"}</Eyebrow>
                      <H3><time dateTime={v.scheduledAt}>{formatAppointment(v.scheduledAt)}</time></H3>
                      <Caption>{relativeDays(v.scheduledAt)} · {visitLine(v, userId, people.get(otherPartyId(v, userId)) ?? null)}</Caption>
                    </div>
                    <VisitBadge status={v.status} />
                  </div>
                  {v.arrivalNote ? (
                    <div className="stack gap-2">
                      <Eyebrow>Getting there</Eyebrow>
                      <Body>{v.arrivalNote}</Body>
                    </div>
                  ) : (
                    <Caption>
                      {v.hostId === userId
                        ? "You have not yet left the practicalities: where to park, who to ask for, when to arrive."
                        : "The host has not yet left the practicalities."}
                    </Caption>
                  )}
                  <div className="row gap-4 wrap">
                    <Button href={`/visits/${v.id}`} size="sm" variant="secondary">Open the visit</Button>
                    {past && (
                      <QuickAction action={markVisitHeld} fields={{ visit_id: v.id }} variant="primary" pendingText="Recording…">
                        Record it as held
                      </QuickAction>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {held.length > 0 && (
        <Section title="Held">
          <HairlineList>
            {held.map((v) => {
              const mine = notes.filter((n) => n.visitId === v.id && n.body.trim().length > 0);
              const loose = looseTakeaways(mine, userId);
              return (
                <HairlineRow
                  key={v.id}
                  href={`/visits/${v.id}`}
                  date={<time dateTime={v.scheduledAt}>{formatDayMonth(v.scheduledAt)}</time>}
                  title={v.practiceName ?? addressOf(v.hostId)}
                  meta={[
                    v.hostId === userId ? `${addressOf(v.visitorId)} came to you` : `You went to ${addressOf(v.hostId)}`,
                    `${mine.length} ${mine.length === 1 ? "note" : "notes"} on the record`,
                    loose > 0 ? `${loose} ${loose === 1 ? "takeaway" : "takeaways"} still to set down` : null,
                  ].filter(Boolean).join(" · ")}
                  right={<VisitBadge status={v.status} />}
                />
              );
            })}
          </HairlineList>
        </Section>
      )}

      {visits.length === 0 && circles.length > 0 && (
        <Section title="Nothing arranged yet">
          <EmptyState
            title="No morning has been proposed, either way."
            action={<Button href="#propose" size="sm">Propose a morning</Button>}
          >
            The first one changes how you read your own practice. Ask to visit somebody, or open your own morning to them.
          </EmptyState>
        </Section>
      )}

      {circles.length > 0 && (
        <Section title="The ledger" aside={<Caption>Every practice seen, and every practice shown.</Caption>}>
          <div className="stack gap-6">
            {circles.map((circle) => (
              <LedgerBlock key={circle.id} circle={circle} visits={visits} userId={userId} />
            ))}
          </div>
        </Section>
      )}

      <Divider />

      <Section title="Propose a morning" id="propose">
        {circles.length === 0 ? (
          <EmptyState title="You are not yet in a circle." action={<Button href="/circle" size="sm" variant="secondary">Your circle</Button>}>
            A visit is arranged between two principals of the same circle. The House will seat you first.
          </EmptyState>
        ) : (
          <div className="stack gap-6">
            {withWhom && people.has(withWhom) && (
              <Notice tone="info">{addressOf(withWhom)} is chosen below. Pick the morning and send it.</Notice>
            )}
            {circles.map((circle) => (
              <ProposeForCircle
                key={circle.id}
                circle={circle}
                userId={userId}
                preselect={withCircle ? (withCircle === circle.id ? withWhom ?? null : null) : withWhom ?? null}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/** Takeaways the viewer wrote that are not yet set down as a commitment. */
function looseTakeaways(notes: VisitNote[], userId: string): number {
  return notes.filter((n) => n.kind === "takeaway" && n.authorId === userId && !n.commitmentId).length;
}

/* ---------- The ledger, one circle at a time ---------- */

function LedgerBlock({ circle, visits, userId }: { circle: CircleWithMembers; visits: Visit[]; userId: string }) {
  const ledger = visitLedger(circle, visits, userId);
  const total = ledger.visited.length + ledger.toVisit.length;
  if (total === 0) return null;

  return (
    <Card>
      <Eyebrow>{circleLabel(circle, userId)}</Eyebrow>
      <Body>{ledgerSummary(ledger, total)}</Body>
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
          {ledger.toVisit.length > 0 && (
            <div className="stack gap-3">
              <Caption>Still to see:</Caption>
              {ledger.toVisit.map((p) => (
                <div key={p.id} className="row between wrap gap-3">
                  <Person name={p.fullName} size="sm" meta={p.practiceName ?? "Principal"} />
                  <Button href={`/visits?with=${p.id}&circle=${circle.id}#propose`} size="sm" variant="quiet">Ask to visit</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stack gap-3">
          <Eyebrow>Principals who have been inside yours</Eyebrow>
          {ledger.hosted.length === 0 ? (
            <Caption>Nobody yet. Open a morning and they will come.</Caption>
          ) : (
            <HairlineList>
              {ledger.hosted.map(({ profile, at, visitId }) => (
                <HairlineRow
                  key={profile.id}
                  href={`/visits/${visitId}`}
                  date={<time dateTime={at}>{formatDayMonth(at)}</time>}
                  title={profile.fullName}
                  meta="Was inside your practice"
                />
              ))}
            </HairlineList>
          )}
          {ledger.toHost.length > 0 && (
            <div className="stack gap-3">
              <Caption>Still to see yours:</Caption>
              {ledger.toHost.map((p) => (
                <div key={p.id} className="row between wrap gap-3">
                  <Person name={p.fullName} size="sm" meta={p.practiceName ?? "Principal"} />
                  <Button href={`/visits?with=${p.id}&circle=${circle.id}#propose`} size="sm" variant="quiet">Offer to host</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/** "You have visited two of the five. Three practices to go, and two principals still to see yours." */
function ledgerSummary(ledger: VisitLedger, total: number): string {
  const seen = ledger.visited.length;
  const toVisit = ledger.toVisit.length;
  const toHost = ledger.toHost.length;

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

/** "Your pair · Dr Amara Adesanya", "Your pod · The Marylebone Six". */
function circleLabel(circle: CircleWithMembers, userId: string): string {
  return `${circle.kind === "pair" ? "Your pair" : "Your pod"} · ${circleTitle(circle, userId)}`;
}

const NUMBERS = ["none", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
function count(n: number): string {
  return NUMBERS[n] ?? String(n);
}
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- Proposing ----------
   Two small forms rather than one with a direction toggle: a Select carries
   one value, and "whose practice" is the whole of the difference. The circle
   travels with the form, so a principal can never be asked into a circle they
   do not sit in. */

function ProposeForCircle({
  circle,
  userId,
  preselect,
}: {
  circle: CircleWithMembers;
  userId: string;
  preselect: string | null;
}) {
  const others = circle.members.filter((m) => m.userId !== userId).map((m) => m.profile);
  if (others.length === 0) {
    return (
      <div className="stack gap-3">
        <Eyebrow>{circleLabel(circle, userId)}</Eyebrow>
        <EmptyState title="Nobody has taken the other seat yet.">The House will introduce you, and a morning can be proposed then.</EmptyState>
      </div>
    );
  }
  const options = others.map((p) => ({
    value: p.id,
    label: p.practiceName ? `${p.fullName} · ${p.practiceName}` : p.fullName,
  }));
  const chosen = preselect && others.some((p) => p.id === preselect) ? preselect : undefined;

  return (
    <div className="stack gap-4">
      <Eyebrow>{circleLabel(circle, userId)}</Eyebrow>
      <div className="grid-even">
        <Card>
          <H3>Ask to visit.</H3>
          <Caption>You go to them, for a morning inside their practice.</Caption>
          <Form action={proposeVisit} className="stack gap-4">
            <input type="hidden" name="circle_id" value={circle.id} />
            <Select
              label="Whose practice"
              name="host_id"
              options={options}
              defaultValue={chosen}
              help="Anyone else seated in this circle."
            />
            <Field
              label="The morning"
              name="scheduled_at"
              type="datetime-local"
              defaultValue={defaultMorning()}
              required
              help="Mornings work best: the huddle, the surgeries and the diary all happen before lunch."
            />
            <TextArea
              label="A word with it"
              name="proposal_note"
              rows={2}
              placeholder="What you hope to see."
              help="Optional. It is the first thing they read."
            />
            <label className="check single" htmlFor={`ask-u-${circle.id}`}>
              <input id={`ask-u-${circle.id}`} type="checkbox" name="undertaking" value="given" />
              <span>I give the undertaking. {UNDERTAKING}</span>
            </label>
            <FieldError name="undertaking" />
            <div className="form-actions">
              <SubmitButton pendingText="Asking…">Ask to visit</SubmitButton>
            </div>
          </Form>
        </Card>

        <Card>
          <H3>Offer to host.</H3>
          <Caption>They come to you, and see your morning as it actually runs.</Caption>
          <Form action={proposeVisit} className="stack gap-4">
            <input type="hidden" name="circle_id" value={circle.id} />
            <input type="hidden" name="host_id" value={userId} />
            <Select
              label="Who comes"
              name="visitor_id"
              options={options}
              defaultValue={chosen}
              help="Anyone else seated in this circle."
            />
            <Field
              label="The morning"
              name="scheduled_at"
              type="datetime-local"
              defaultValue={defaultMorning()}
              required
              help="Pick an ordinary morning. A tidied one teaches nobody anything."
            />
            <TextArea
              label="A word with it"
              name="proposal_note"
              rows={2}
              placeholder="What you would like a second pair of eyes on."
              help="Optional."
            />
            <label className="check single" htmlFor={`host-u-${circle.id}`}>
              <input id={`host-u-${circle.id}`} type="checkbox" name="undertaking" value="given" />
              <span>I give the undertaking. {UNDERTAKING}</span>
            </label>
            <div className="form-actions">
              <SubmitButton pendingText="Offering…">Offer to host</SubmitButton>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
