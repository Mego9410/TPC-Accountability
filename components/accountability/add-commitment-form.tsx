"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Field } from "@/components/ui";
import { addCommitment } from "@/lib/actions/accountability";
import { BLOCK_WEEKS, EMPTY_ACTION_STATE } from "@/lib/accountability";

export function AddCommitmentForm({
  blockId,
  defaultWeek,
}: {
  blockId: string;
  defaultWeek: number;
}) {
  const [state, formAction, pending] = useActionState(addCommitment, EMPTY_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}
    >
      <input type="hidden" name="goal_block_id" value={blockId} />
      <div className="field" style={{ width: 96 }}>
        <label htmlFor="week_number">Week</label>
        <select id="week_number" name="week_number" defaultValue={String(defaultWeek)}>
          {Array.from({ length: BLOCK_WEEKS }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <Field
          label="New commitment"
          name="text"
          placeholder="One concrete thing you'll do this week"
          error={state.errors.text}
          aria-invalid={Boolean(state.errors.text)}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
