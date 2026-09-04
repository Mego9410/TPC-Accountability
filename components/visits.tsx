import { format } from "date-fns";
import { VISIT_NOTE_HELP, VISIT_NOTE_LABEL, address, type Profile, type Visit, type VisitNoteKind } from "@/lib/domain";
import { Body, Caption, Card, Eyebrow, H3 } from "@/components/ui";
import { Form, QuickAction, SubmitButton, FieldError } from "@/components/ui/form";
import { respondToVisit } from "@/lib/actions/visits";

/* =========================================================================
   The furniture of a companion practice visit: the undertaking both parties
   give, the shape of the morning, and the agree-or-decline pair.
   ------------------------------------------------------------------------- */

/** The words of the confidentiality undertaking, given before a morning is agreed. */
export const UNDERTAKING = "What is seen in the building stays in the building.";

/** The indicative shape of a morning. A suggestion, never a timetable. */
export const PROGRAMME: Array<{ at: string; what: string }> = [
  { at: "8.40", what: "Arrive, coffee, and what the host wants a second pair of eyes on" },
  { at: "9.00", what: "The huddle, standing at the back" },
  { at: "9.30", what: "The surgeries: how the day is set up and who does what" },
  { at: "11.00", what: "The diary, chair by chair, six weeks out" },
  { at: "12.15", what: "Reception: the phone, the recall list, the first conversation a patient has" },
  { at: "1.00", what: "Lunch, and three things each of you will take home" },
];

/** The visitor sets the agenda, within whatever the host is willing to show. */
export function Programme() {
  return (
    <Card>
      <ol className="programme">
        {PROGRAMME.map((item) => (
          <li key={item.at}>
            <span className="at">{item.at}</span>
            <span className="what">{item.what}</span>
          </li>
        ))}
      </ol>
      <Caption>The visitor sets the agenda, within whatever the host is willing to show.</Caption>
    </Card>
  );
}

/** The date and time a `datetime-local` control wants. */
export function localDateTime(iso: string | Date): string {
  return format(typeof iso === "string" ? new Date(iso) : iso, "yyyy-MM-dd'T'HH:mm");
}

/** Half past eight, about three weeks out: the morning a proposal defaults to. */
export function defaultMorning(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 21);
  d.setHours(8, 30, 0, 0);
  return localDateTime(d);
}

/** Who is going where, said plainly from the viewer's chair. */
export function visitLine(visit: Visit, userId: string, other: Profile | null): string {
  const them = other ? address(other) : "the other principal";
  if (visit.hostId === userId) return `${them} comes to you at ${visit.practiceName ?? "your practice"}.`;
  return `You go to ${them} at ${visit.practiceName ?? "their practice"}.`;
}

/**
 * The answer to a proposal. Agreeing carries the undertaking; declining does
 * not, and no reason is owed.
 */
export function RespondToVisit({ visitId, proposerName }: { visitId: string; proposerName: string }) {
  return (
    <div className="stack gap-4">
      <Form action={respondToVisit} className="stack gap-3">
        <input type="hidden" name="visit_id" value={visitId} />
        <input type="hidden" name="response" value="agree" />
        <label className="check single" htmlFor={`u-${visitId}`}>
          <input id={`u-${visitId}`} type="checkbox" name="undertaking" value="given" />
          <span>I give the undertaking. {UNDERTAKING}</span>
        </label>
        <FieldError name="undertaking" />
        <div className="form-actions">
          <SubmitButton pendingText="Agreeing…">Agree to the morning</SubmitButton>
        </div>
      </Form>
      <div className="stack gap-2">
        <QuickAction
          action={respondToVisit}
          fields={{ visit_id: visitId, response: "decline" }}
          confirm={`Decline this morning? ${proposerName} is told only that it is declined.`}
          pendingText="Declining…"
        >
          Decline
        </QuickAction>
        <Caption>You may decline for any reason, and no reason is owed. None is recorded.</Caption>
      </div>
    </div>
  );
}

/** One of the four parts of the record, with its notes and its own help. */
export function RecordBlockHead({ kind }: { kind: VisitNoteKind }) {
  return (
    <div className="stack gap-2">
      <Eyebrow>{VISIT_NOTE_LABEL[kind]}</Eyebrow>
      <Caption>{VISIT_NOTE_HELP[kind]}</Caption>
    </div>
  );
}

/** The standing line about what a visit is, used where a page needs the sense of it. */
export function VisitPreamble() {
  return (
    <Card>
      <H3>A morning inside another principal&rsquo;s practice.</H3>
      <Body className="muted">
        Either of you may propose one. The other agrees or declines, and may decline without giving a reason. Both give the
        undertaking before it is agreed: {UNDERTAKING.toLowerCase()}
      </Body>
    </Card>
  );
}
