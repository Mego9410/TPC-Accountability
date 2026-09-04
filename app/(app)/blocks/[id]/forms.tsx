"use client";

import { Form, SubmitButton } from "@/components/ui/form";
import { Caption, Field, Select, TextArea } from "@/components/ui";
import { addCommitment } from "@/lib/actions/blocks";
import { addNote } from "@/lib/actions/notes";
import { BLOCK_WEEKS } from "@/lib/domain";

const WEEK_OPTIONS = Array.from({ length: BLOCK_WEEKS }, (_, i) => ({ value: i + 1, label: `Week ${i + 1}` }));

/** The owner sets down a commitment for a given week. */
export function AddCommitmentForm({ blockId, defaultWeek }: { blockId: string; defaultWeek: number }) {
  return (
    <Form action={addCommitment} resetOnSuccess>
      {(state) => (
        <>
          <input type="hidden" name="block_id" value={blockId} />
          <div className="form-row">
            <Select label="Week" name="week" options={WEEK_OPTIONS} defaultValue={defaultWeek} error={state.errors.week} />
            <Field label="Commitment" name="text" required maxLength={200} placeholder="One thing you will actually do" error={state.errors.text} />
          </div>
          <div className="form-actions">
            <SubmitButton size="sm" pendingText="Setting down…">Set it down</SubmitButton>
            <Caption>Short, specific, and finishable in a week.</Caption>
          </div>
        </>
      )}
    </Form>
  );
}

/** A mentor (or the House) leaves a note against one commitment. */
export function LeaveNoteForm({ aboutUserId, commitmentId, ownerName }: { aboutUserId: string; commitmentId: string; ownerName: string }) {
  return (
    <Form action={addNote} resetOnSuccess>
      {(state) => (
        <>
          <input type="hidden" name="about_user_id" value={aboutUserId} />
          <input type="hidden" name="commitment_id" value={commitmentId} />
          <TextArea label={`Note for ${ownerName}`} name="body" rows={2} required maxLength={1000} error={state.errors.body} placeholder="A question is usually more use than advice." />
          <div className="form-actions">
            <SubmitButton size="sm" variant="secondary" pendingText="Leaving…">Leave the note</SubmitButton>
          </div>
        </>
      )}
    </Form>
  );
}
