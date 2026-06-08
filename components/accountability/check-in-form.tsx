"use client";

import { useActionState } from "react";
import { Button, TextArea } from "@/components/ui";
import { saveCheckIn } from "@/lib/actions/accountability";
import { BLOCK_WEEKS, EMPTY_ACTION_STATE } from "@/lib/accountability";

export function CheckInForm({ defaultWeek }: { defaultWeek: number | null }) {
  const [state, formAction, pending] = useActionState(saveCheckIn, EMPTY_ACTION_STATE);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

      <div className="field" style={{ width: 120 }}>
        <label htmlFor="week_number">Week</label>
        <select id="week_number" name="week_number" defaultValue={defaultWeek ? String(defaultWeek) : ""}>
          <option value="">—</option>
          {Array.from({ length: BLOCK_WEEKS }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      <TextArea
        label="What went well this week"
        name="did_well"
        placeholder="The wins, however small."
        error={state.errors.did_well}
        rows={3}
      />
      <TextArea
        label="What I struggled with"
        name="struggled_with"
        placeholder="Where you got stuck, or what slipped."
        rows={3}
      />
      <TextArea
        label="Next week's focus"
        name="next_week_focus"
        placeholder="The one thing that matters most next week."
        rows={3}
      />

      <div className="field" style={{ maxWidth: 240 }}>
        <label htmlFor="energy_score">Energy this week (1–10)</label>
        <input
          id="energy_score"
          name="energy_score"
          type="number"
          min={1}
          max={10}
          step={1}
          placeholder="7"
        />
        {state.errors.energy_score && <div className="help err">{state.errors.energy_score}</div>}
      </div>

      <div className="row">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Log this week's check-in"}
        </Button>
      </div>
    </form>
  );
}
