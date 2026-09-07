import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/session";
import { address, awaitingAnswerFrom, otherPartyOfVisit, practiceLine, type Profile } from "@/lib/domain";
import { answerVisit, cancelVisit, markVisitHeld, updateVisitDetails } from "@/lib/actions/visits";
import { formatAppointment, relativeDays, toLocalInputValue } from "@/lib/weeks";
import {
  Body, Button, Caption, Card, Divider, EmptyState, H3, PageHeader, Person, Section, TextLink, VisitBadge,
} from "@/components/ui";
import { FField, FTextArea, Form, QuickAction, SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "The morning" };

const PROGRAMME: Array<{ at: string; what: string }> = [
  { at: "8.40", what: "Arrive, and stand somewhere out of the way." },
  { at: "9.00", what: "The huddle." },
  { at: "9.30", what: "The surgeries." },
  { at: "11.00", what: "The diary, and how it is built." },
  { at: "12.15", what: "Reception, and how the telephone is answered." },
  { at: "1.00", what: "Lunch, and the questions you have been saving." },
];

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repo, userId } = await requireViewer();

  const visit = await repo.getVisit(id);
  if (!visit || (visit.visitorId !== userId && visit.hostId !== userId)) notFound();

  const other: Profile | null = (await repo.listProfiles([otherPartyOfVisit(visit, userId)]))[0] ?? null;
  const youHost = visit.hostId === userId;
  const past = new Date(visit.scheduledAt).getTime() < Date.now();
  const theirName = other ? address(other) : "the other principal";

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="A companion visit"
        title={<time dateTime={visit.scheduledAt}>{formatAppointment(visit.scheduledAt)}</time>}
        lede={
          youHost
            ? `${theirName} would spend the morning inside your practice.`
            : `A morning inside ${visit.practiceName ?? "their practice"}.`
        }
        actions={<TextLink href="/visits" back>All the mornings</TextLink>}
      />

      <Card>
        <div className="row between wrap gap-4">
          <Person
            name={other?.fullName ?? "A principal"}
            size="lg"
            meta={other ? practiceLine(other) : "A member of the Club"}
          />
          <VisitBadge status={visit.status} />
        </div>
        <Caption>
          {relativeDays(visit.scheduledAt)} · {youHost ? "You are the host" : "You are the visitor"}
        </Caption>
        {visit.proposalNote && <blockquote className="quote">{visit.proposalNote}</blockquote>}
      </Card>

      {visit.status === "proposed" && (
        <Section title="The answer">
          {awaitingAnswerFrom(visit, userId) ? (
            <Card emphasis>
              <H3>{theirName} has proposed this morning.</H3>
              <Body className="muted maxw-prose">
                Agree, or decline. Declining is an ordinary answer and no reason is owed.
              </Body>
              <div className="row wrap gap-3">
                <QuickAction action={answerVisit} fields={{ visit_id: visit.id, answer: "agree" }} variant="primary">
                  Agree to the morning
                </QuickAction>
                <QuickAction
                  action={answerVisit}
                  fields={{ visit_id: visit.id, answer: "decline" }}
                  confirm="Decline this morning? No reason is owed, and none is recorded."
                >
                  Decline
                </QuickAction>
              </div>
            </Card>
          ) : (
            <Card>
              <H3>Waiting on {theirName}.</H3>
              <Body className="muted maxw-prose">
                They may accept or decline. Nothing is in the diary until they have said yes.
              </Body>
              <div className="row wrap gap-3">
                <QuickAction
                  action={cancelVisit}
                  fields={{ visit_id: visit.id }}
                  confirm="Cancel this proposal? It cannot be undone."
                >
                  Cancel the proposal
                </QuickAction>
              </div>
            </Card>
          )}
        </Section>
      )}

      {visit.status === "agreed" && (
        <>
          <Section title="Arriving">
            {youHost ? (
              <Card>
                <Form action={updateVisitDetails}>
                  <input type="hidden" name="visit_id" value={visit.id} />
                  <FTextArea
                    label="The practicalities"
                    name="arrival_note"
                    rows={3}
                    maxLength={800}
                    defaultValue={visit.arrivalNote ?? ""}
                    placeholder="Where to park, whom to ask for, when the door is open."
                    help="Only you can write this, and only they read it."
                  />
                  <div className="form-actions">
                    <SubmitButton variant="secondary" pendingText="Saving…">Save the arrival note</SubmitButton>
                  </div>
                </Form>
              </Card>
            ) : visit.arrivalNote ? (
              <Card>
                <Body>{visit.arrivalNote}</Body>
                <Caption>Written by {theirName}.</Caption>
              </Card>
            ) : (
              <EmptyState title="No arrival note yet.">
                {theirName} has not said where to park or whom to ask for. There is time.
              </EmptyState>
            )}
          </Section>

          <Section title="The shape of the morning" aside={<Caption>Indicative only.</Caption>}>
            <Card>
              <ol className="programme">
                {PROGRAMME.map((p) => (
                  <li key={p.at}>
                    <span className="at">{p.at}</span>
                    <span className="what">{p.what}</span>
                  </li>
                ))}
              </ol>
              <Divider tight />
              <Body className="muted maxw-prose">
                The visitor sets the agenda, within whatever the host is willing to show.
              </Body>
            </Card>
          </Section>

          <Section title="Moving it, or calling it off">
            <Card>
              <Form action={updateVisitDetails}>
                <input type="hidden" name="visit_id" value={visit.id} />
                <FField
                  label="A different morning"
                  name="scheduled_at"
                  type="datetime-local"
                  defaultValue={toLocalInputValue(new Date(visit.scheduledAt))}
                  help="Either of you may move it. The other keeps their agreement."
                />
                <div className="form-actions">
                  <SubmitButton variant="secondary" pendingText="Moving…">Move the morning</SubmitButton>
                </div>
              </Form>
              <Divider tight />
              <div className="row wrap gap-3">
                {past && (
                  <QuickAction action={markVisitHeld} fields={{ visit_id: visit.id }} variant="primary">
                    Record it as held
                  </QuickAction>
                )}
                <QuickAction
                  action={cancelVisit}
                  fields={{ visit_id: visit.id }}
                  confirm="Cancel this morning? A difficult week is reason enough, but it cannot be undone."
                >
                  Cancel the morning
                </QuickAction>
              </div>
              {past && <Caption>The morning has passed. Record it as held, and write down what struck you.</Caption>}
            </Card>
          </Section>
        </>
      )}

      {visit.status === "held" && (
        <Section title="What you both made of it" aside={<Caption>Seen and written by both of you.</Caption>}>
          <Card>
            <Form action={updateVisitDetails}>
              <input type="hidden" name="visit_id" value={visit.id} />
              <FTextArea
                label="The notes"
                name="notes"
                rows={10}
                maxLength={4000}
                defaultValue={visit.notes ?? ""}
                placeholder="What you saw, what you would take, and what you would not."
                help="One record, kept between the two of you. Add to it rather than writing over it."
              />
              <div className="form-actions">
                <SubmitButton pendingText="Saving…">Save the notes</SubmitButton>
              </div>
            </Form>
          </Card>
        </Section>
      )}

      {(visit.status === "declined" || visit.status === "cancelled") && (
        <Section title="Not this time">
          <Card>
            <Body className="maxw-prose">
              {visit.status === "declined"
                ? "This morning was declined. No reason is owed, and none is recorded."
                : "This morning was called off. A difficult week is reason enough."}
            </Body>
            <div className="row wrap gap-3">
              <Button href="/visits/new">Propose another</Button>
            </div>
          </Card>
        </Section>
      )}

      {other && (
        <Section title="A word">
          <div className="row wrap gap-3">
            <Button href={`/messages?with=${other.id}`} variant="quiet" size="sm">
              Write to {theirName}
            </Button>
          </div>
        </Section>
      )}
    </div>
  );
}
