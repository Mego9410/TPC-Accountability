"use client";

import { useActionState } from "react";
import { Button, Field, TextArea } from "@/components/ui";
import { createGoalBlock } from "@/lib/actions/accountability";
import { EMPTY_ACTION_STATE } from "@/lib/accountability";

export function CreateBlockForm({ defaultStart }: { defaultStart: string }) {
  const [state, formAction, pending] = useActionState(createGoalBlock, EMPTY_ACTION_STATE);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {state.message && (
        <div className="notice" role="alert">
          {state.message}
        </div>
      )}
      <Field
        label="Title"
        name="title"
        placeholder="Get sale-ready in three years"
        error={state.errors.title}
        aria-invalid={Boolean(state.errors.title)}
      />
      <TextArea
        label="What this block is for"
        name="description"
        placeholder="The outcome you want twelve weeks from now."
      />
      <Field
        label="Start date"
        name="start_date"
        type="date"
        defaultValue={defaultStart}
        help="Your block runs twelve weeks from this date."
        error={state.errors.start_date}
        aria-invalid={Boolean(state.errors.start_date)}
        style={{ maxWidth: 220 }}
      />
      <div className="row">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Begin the block"}
        </Button>
      </div>
    </form>
  );
}
