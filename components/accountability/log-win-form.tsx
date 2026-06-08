"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Field, TextArea } from "@/components/ui";
import { logWin } from "@/lib/actions/accountability";
import { EMPTY_ACTION_STATE } from "@/lib/accountability";
import type { GoalBlock } from "@/lib/types";

export function LogWinForm({ blocks }: { blocks: Pick<GoalBlock, "id" | "title">[] }) {
  const [state, formAction, pending] = useActionState(logWin, EMPTY_ACTION_STATE);
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
        label="The win"
        name="title"
        placeholder="Signed the associate contract"
        error={state.errors.title}
        aria-invalid={Boolean(state.errors.title)}
      />
      <TextArea label="A little more (optional)" name="detail" placeholder="What made it matter." rows={2} />
      {blocks.length > 0 && (
        <div className="field" style={{ maxWidth: 360 }}>
          <label htmlFor="goal_block_id">Link to a block (optional)</label>
          <select id="goal_block_id" name="goal_block_id" defaultValue="">
            <option value="">No block</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="row">
        <Button type="submit" disabled={pending}>
          {pending ? "Logging…" : "Log a win"}
        </Button>
      </div>
    </form>
  );
}
