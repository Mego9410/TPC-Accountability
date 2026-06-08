"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Field, TextArea } from "@/components/ui";
import { createChallenge } from "@/lib/actions/challenges";
import { EMPTY_ACTION_STATE } from "@/lib/accountability";

export function CreateChallengeForm({ defaultStart }: { defaultStart: string }) {
  const [state, formAction, pending] = useActionState(createChallenge, EMPTY_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {state.ok && state.message && (
        <div className="notice" role="status">
          {state.message}
        </div>
      )}
      {!state.ok && state.message && (
        <div className="notice" role="alert">
          {state.message}
        </div>
      )}
      <Field
        label="Title"
        name="title"
        placeholder="The 90-day new-patient sprint"
        error={state.errors.title}
        aria-invalid={Boolean(state.errors.title)}
      />
      <TextArea label="Description" name="description" placeholder="What members are racing toward." rows={2} />
      <div className="grid-even">
        <Field
          label="Start date"
          name="start_date"
          type="date"
          defaultValue={defaultStart}
          error={state.errors.start_date}
          aria-invalid={Boolean(state.errors.start_date)}
        />
        <Field label="End date (optional)" name="end_date" type="date" help="Defaults to a 12-week sprint." />
      </div>
      <div className="row">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creating…" : "Create challenge"}
        </Button>
      </div>
    </form>
  );
}
