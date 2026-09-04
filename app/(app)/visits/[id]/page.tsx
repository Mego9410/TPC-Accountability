import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/session";
import {
  VISIT_NOTE_HELP,
  VISIT_NOTE_LABEL,
  address,
  noteKindsFor,
  otherPartyId,
  undertakingGiven,
  type Profile,
  type Visit,
  type VisitNote,
  type VisitNoteKind,
} from "@/lib/domain";
import { formatAppointment, formatDayMonth, relativeDays } from "@/lib/weeks";
import {
  addVisitNote, cancelVisit, markVisitHeld, removeVisitNote, rescheduleVisit, setArrivalNote, setDownTakeaway,
} from "@/lib/actions/visits";
import {
  Body, Button, Caption, Card, EmptyState, Eyebrow, H3, Notice, PageHeader, Person, Section, TextLink, VisitBadge,
} from "@/components/ui";
import { Form, QuickAction, SubmitButton, FField as Field, FTextArea as TextArea } from "@/components/ui/form";
import { Programme, RespondToVisit, UNDERTAKING, localDateTime, visitLine } from "@/components/visits";

export const metadata: Metadata = { title: "Practice visit" };

const RECORD_ORDER: VisitNoteKind[] = ["observation", "takeaway", "for_host", "host_note"];

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile, repo, userId } = await requireViewer();
  const { id } = await params;

  const visit = await repo.getVisit(id);
  if (!visit) notFound();
  const isParty = visit.visitorId === userId || visit.hostId === userId;
  if (!isParty && profile.role !== "staff") notFound();

  const [visitor, host] = await Promise.all([repo.getProfile(visit.visitorId), repo.getProfile(visit.hostId)]);
  const notes = (await repo.listVisitNotes([visit.id])).filter((n) => n.body.trim().length > 0);
  const other = isParty ? (otherPartyId(visit, userId) === visit.hostId ? host : visitor) : null;

  const hosting = visit.hostId === userId;
  const past = new Date(visit.scheduledAt).getTime() < Date.now();
  const who = (id2: string): string => {
    if (id2 === visit.visitorId) return visitor ? address(visitor) : "The visitor";
    if (id2 === visit.hostId) return host ? address(host) : "The host";
    return "A principal";
  };

  return (
    <div className="section fade-enter">
      <TextLink href="/visits" back>Practice visits</TextLink>
      <PageHeader
        eyebrow={
          <span className="row gap-3">
            <VisitBadge status={visit.status} />
            <span>{visit.practiceName ?? "A practice"}</span>
          </span>
        }
        title={<time dateTime={visit.scheduledAt}>{formatAppointment(visit.scheduledAt)}</time>}
        lede={isParty ? `${lede(visit, userId, other)} ${capitalise(relativeDays(visit.scheduledAt))}.` : undefined}
      />

      <div className="row gap-5 wrap">
        <Person
          name={visitor?.fullName ?? "The visitor"}
          size="sm"
          meta={visit.visitorId === userId ? "The visitor · you" : "The visitor"}
        />
        <Person
          name={host?.fullName ?? "The host"}
          size="sm"
          meta={[visit.hostId === userId ? "The host · you" : "The host", visit.practiceName].filter(Boolean).join(" · ")}
        />
      </div>

      {!isParty && <Notice tone="info">You are reading this visit as the House. The record is not yours to write.</Notice>}

      {visit.status === "proposed" && (
        <Proposed visit={visit} userId={userId} isParty={isParty} who={who} other={other} />
      )}

      {visit.status === "agreed" && (
        <Agreed visit={visit} isParty={isParty} hosting={hosting} past={past} who={who} />
      )}

      {visit.status === "held" && (
        <Record visit={visit} userId={userId} notes={notes} who={who} visitor={visitor} host={host} />
      )}

      {(visit.status === "declined" || visit.status === "cancelled") && (
        <Section title={visit.status === "declined" ? "Declined" : "Cancelled"}>
          <Card>
            <H3>{visit.status === "declined" ? "This morning was declined." : "This morning was cancelled."}</H3>
            <Body className="muted">
              {visit.status === "declined"
                ? "No reason was asked for and none is recorded. It is a diary, not a judgement: propose another when the month suits you both."
                : "A difficult week is reason enough. The morning is out of both diaries; another can be proposed whenever it suits."}
            </Body>
            <div className="row gap-4 wrap">
              <Button href="/visits#propose" size="sm">Propose another</Button>
              <TextLink href="/visits">All visits</TextLink>
            </div>
          </Card>
        </Section>
      )}
    </div>
  );
}

/* ---------- Proposed ---------- */

function Proposed({
  visit, userId, isParty, who, other,
}: {
  visit: Visit;
  userId: string;
  isParty: boolean;
  who: (id: string) => string;
  other: Profile | null;
}) {
  const yourTurn = isParty && visit.proposedById !== userId;
  const proposer = who(visit.proposedById);
  return (
    <>
      <Section title="The proposal">
        <Card emphasis={yourTurn}>
          <Eyebrow>{proposer} proposed it</Eyebrow>
          {visit.proposalNote ? (
            <blockquote className="quote">
              {visit.proposalNote}
              <cite>{proposer}</cite>
            </blockquote>
          ) : (
            <Caption>No word came with the proposal. The morning itself is the invitation.</Caption>
          )}
          <Caption>{visitLine(visit, isParty ? userId : visit.visitorId, other)}</Caption>
        </Card>
      </Section>

      <Section title="The undertaking">
        <Card>
          <Body>{UNDERTAKING}</Body>
          <dl className="facts">
            <div>
              <dt>{who(visit.visitorId)}</dt>
              <dd>{visit.visitorAgreedAt ? `Given ${formatDayMonth(visit.visitorAgreedAt)}` : "Not yet given"}</dd>
            </div>
            <div>
              <dt>{who(visit.hostId)}</dt>
              <dd>{visit.hostAgreedAt ? `Given ${formatDayMonth(visit.hostAgreedAt)}` : "Not yet given"}</dd>
            </div>
          </dl>
          <Caption>
            {undertakingGiven(visit)
              ? "Both undertakings are given."
              : "A morning is agreed only once both principals have given it."}
          </Caption>
        </Card>
      </Section>

      <Section title={yourTurn ? "Your answer" : "Waiting"}>
        {yourTurn ? (
          <Card emphasis>
            <H3>Agree, or decline.</H3>
            <Caption>Nothing is owed either way. A morning declined costs the circle nothing.</Caption>
            <RespondToVisit visitId={visit.id} proposerName={proposer} />
          </Card>
        ) : (
          <Card>
            <H3>Waiting on {who(otherPartyId(visit, isParty ? userId : visit.proposedById))}.</H3>
            <Caption>They may agree or decline, and they owe no reason for declining.</Caption>
            {isParty && visit.proposedById === userId && (
              <div className="row gap-4 wrap">
                <QuickAction
                  action={cancelVisit}
                  fields={{ visit_id: visit.id }}
                  confirm="Withdraw this proposal? They will see it struck from the diary."
                  pendingText="Withdrawing…"
                >
                  Withdraw the proposal
                </QuickAction>
              </div>
            )}
          </Card>
        )}
      </Section>
    </>
  );
}

/* ---------- Agreed ---------- */

function Agreed({
  visit, isParty, hosting, past, who,
}: {
  visit: Visit;
  isParty: boolean;
  hosting: boolean;
  past: boolean;
  who: (id: string) => string;
}) {
  return (
    <>
      <Section title="Getting there">
        {hosting ? (
          <Card>
            <H3>The practicalities are yours to set.</H3>
            <Caption>Where to park, who to ask for at reception, and what time the door is open.</Caption>
            <Form action={setArrivalNote}>
              <input type="hidden" name="visit_id" value={visit.id} />
              <TextArea
                label="Arrival note"
                name="arrival_note"
                rows={4}
                defaultValue={visit.arrivalNote ?? ""}
                placeholder="Park on the street, not the practice car park. Ask for Nadia at reception; she knows you are coming."
                help={`${who(visit.visitorId)} sees this the moment you save it.`}
              />
              <div className="form-actions">
                <SubmitButton>Save the practicalities</SubmitButton>
              </div>
            </Form>
          </Card>
        ) : (
          <Card>
            <Eyebrow>From {who(visit.hostId)}</Eyebrow>
            {visit.arrivalNote ? (
              <Body>{visit.arrivalNote}</Body>
            ) : (
              <Caption>Nothing left yet. It will appear here when the host writes it, and there is no harm in asking.</Caption>
            )}
          </Card>
        )}
      </Section>

      <Section title="The morning" aside={<Caption>A suggested shape</Caption>}>
        <Programme />
      </Section>

      {isParty && (
        <Section title="If the morning has to move">
          <Card>
            {past && (
              <div className="stack gap-3">
                <H3>The morning has passed.</H3>
                <Caption>Record it as held and the record opens: what you saw, what you are taking back, and what struck you.</Caption>
                <div className="row gap-4 wrap">
                  <QuickAction action={markVisitHeld} fields={{ visit_id: visit.id }} variant="primary" pendingText="Recording…">
                    Record it as held
                  </QuickAction>
                </div>
              </div>
            )}
            <Form action={rescheduleVisit}>
              <input type="hidden" name="visit_id" value={visit.id} />
              <Field
                label="Move it to"
                name="scheduled_at"
                type="datetime-local"
                defaultValue={localDateTime(visit.scheduledAt)}
                required
                help="The other principal sees the new morning at once."
              />
              <div className="form-actions">
                <SubmitButton variant="secondary" pendingText="Moving…">Move the morning</SubmitButton>
              </div>
            </Form>
            <div className="stack gap-2">
              <QuickAction
                action={cancelVisit}
                fields={{ visit_id: visit.id }}
                confirm="Cancel this morning? It comes out of both diaries."
                pendingText="Cancelling…"
              >
                Cancel the visit
              </QuickAction>
              <Caption>A difficult week is reason enough, and none is recorded.</Caption>
            </div>
          </Card>
        </Section>
      )}
    </>
  );
}

/* ---------- Held: the record ---------- */

function Record({
  visit, userId, notes, who, visitor, host,
}: {
  visit: Visit;
  userId: string;
  notes: VisitNote[];
  who: (id: string) => string;
  visitor: Profile | null;
  host: Profile | null;
}) {
  const mayWrite = noteKindsFor(visit, userId);
  const anyNotes = notes.length > 0;
  return (
    <>
      <Section title="The record" aside={<Caption>Written up on both sides</Caption>}>
        <Card>
          <H3>Four parts, so it is useful in a month.</H3>
          <Body className="muted">
            {visitor && host
              ? `${address(visitor)} walked round ${address(host)}'s practice on ${formatDayMonth(visit.scheduledAt)}. Three parts are the visitor's and one is the host's, because both sides learn something.`
              : "Three parts are the visitor's and one is the host's, because both sides learn something."}
          </Body>
          {!anyNotes && mayWrite.length === 0 && (
            <Caption>Nothing has been written down yet.</Caption>
          )}
        </Card>
      </Section>

      {RECORD_ORDER.map((kind) => (
        <RecordBlock
          key={kind}
          kind={kind}
          visit={visit}
          userId={userId}
          notes={notes.filter((n) => n.kind === kind)}
          canAdd={mayWrite.includes(kind)}
          who={who}
        />
      ))}
    </>
  );
}

function RecordBlock({
  kind, visit, userId, notes, canAdd, who,
}: {
  kind: VisitNoteKind;
  visit: Visit;
  userId: string;
  notes: VisitNote[];
  canAdd: boolean;
  who: (id: string) => string;
}) {
  const owner = kind === "host_note" ? who(visit.hostId) : who(visit.visitorId);
  const isParty = userId === visit.visitorId || userId === visit.hostId;

  return (
    <Section title={VISIT_NOTE_LABEL[kind]} aside={<Caption>{owner}</Caption>}>
      <Caption>{VISIT_NOTE_HELP[kind]}</Caption>
      {notes.length === 0 ? (
        <EmptyState title={emptyTitle(kind)}>
          {canAdd ? "Yours to write, below." : `Nothing here yet. ${owner} may still add to it.`}
        </EmptyState>
      ) : (
        <div className="stack gap-4">
          {notes.map((n) => (
            <Card key={n.id} pad="sm">
              <Body>{n.body}</Body>
              <div className="row between wrap gap-3">
                <Caption>
                  {who(n.authorId)}
                  {isParty && n.authorId !== userId ? " · not yours to change" : ""} · <time dateTime={n.createdAt}>{formatDayMonth(n.createdAt)}</time>
                </Caption>
                <div className="visit-note-actions">
                  {kind === "takeaway" && (
                    n.commitmentId ? (
                      n.authorId === userId
                        ? <Caption>Set down in your block · <TextLink href="/blocks">Your blocks</TextLink></Caption>
                        : <Caption>Set down as a commitment.</Caption>
                    ) : n.authorId === userId ? (
                      <QuickAction action={setDownTakeaway} fields={{ visit_id: visit.id, note_id: n.id }} variant="secondary" pendingText="Setting down…">
                        Set it down as a commitment
                      </QuickAction>
                    ) : null
                  )}
                  {n.authorId === userId && (
                    <QuickAction
                      action={removeVisitNote}
                      fields={{ visit_id: visit.id, note_id: n.id }}
                      confirm="Remove this note from the record? It cannot be brought back."
                      pendingText="Removing…"
                    >
                      Remove
                    </QuickAction>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {canAdd && (
        <Card>
          <Form action={addVisitNote} resetOnSuccess>
            <input type="hidden" name="visit_id" value={visit.id} />
            <input type="hidden" name="kind" value={kind} />
            <TextArea
              label="Add a note"
              name="body"
              rows={3}
              placeholder={placeholderFor(kind)}
              help={`It joins “${VISIT_NOTE_LABEL[kind].toLowerCase()}” above, under your name.`}
            />
            <div className="form-actions">
              <SubmitButton size="sm" variant="secondary" pendingText="Writing…">Write it down</SubmitButton>
            </div>
          </Form>
        </Card>
      )}
    </Section>
  );
}

function emptyTitle(kind: VisitNoteKind): string {
  switch (kind) {
    case "observation": return "Nothing observed on the record yet.";
    case "takeaway": return "Nothing taken back yet.";
    case "for_host": return "Nothing said to the host yet.";
    case "host_note": return "The host has written nothing yet.";
  }
}

function placeholderFor(kind: VisitNoteKind): string {
  switch (kind) {
    case "observation": return "The huddle runs to nine minutes and everyone stands.";
    case "takeaway": return "Stand the huddle up and cap it at ten minutes.";
    case "for_host": return "From the corridor, surgery two is the first room a new patient sees.";
    case "host_note": return "They asked why we still take the deposit at the second visit.";
  }
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The one-line sense of the visit, in the tense the status calls for. */
function lede(visit: Visit, userId: string, other: Profile | null): string {
  if (visit.status !== "held") return visitLine(visit, userId, other);
  const them = other ? address(other) : "the other principal";
  return visit.hostId === userId
    ? `${them} spent the morning inside your practice.`
    : `You spent the morning at ${visit.practiceName ?? `${them}'s practice`}.`;
}
