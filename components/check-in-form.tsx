"use client";

import { useState } from "react";
import { Form, SubmitButton } from "@/components/ui/form";
import { Select, TextArea } from "@/components/ui";
import { saveCheckIn } from "@/lib/actions/check-ins";
import { BLOCK_WEEKS, type CheckIn } from "@/lib/domain";

const WEEK_OPTIONS = Array.from({ length: BLOCK_WEEKS }, (_, i) => ({ value: i + 1, label: `Week ${i + 1}` }));

/**
 * The four questions. `existing` prefills the form when this week's check-in
 * is already on the record, in which case saving revises it.
 */
export function CheckInForm({
  circleId,
  defaultWeek,
  existing,
}: {
  circleId: string | null;
  defaultWeek: number | null;
  existing: CheckIn | null;
}) {
  const [energy, setEnergy] = useState<number>(existing?.energy ?? 7);
  const weekDefault = existing?.blockWeek ?? defaultWeek;

  return (
    <Form action={saveCheckIn} refreshOnSuccess>
      {(state) => (
        <>
          {circleId && <input type="hidden" name="circle_id" value={circleId} />}
          <Select
            label="Block week"
            name="block_week"
            options={WEEK_OPTIONS}
            placeholder="No block this week"
            defaultValue={weekDefault ?? ""}
            error={state.errors.block_week}
            help="Which week of your block this check-in belongs to."
          />
          <TextArea
            label="What went well"
            name="did_well"
            rows={3}
            required
            defaultValue={existing?.didWell ?? ""}
            error={state.errors.did_well}
            help="One thing, however small. Numbers are welcome."
          />
          <TextArea
            label="What you struggled with"
            name="struggled_with"
            rows={3}
            defaultValue={existing?.struggledWith ?? ""}
            error={state.errors.struggled_with}
            help="Leave it blank if the week was clean."
          />
          <TextArea
            label="Next week's focus"
            name="next_focus"
            rows={2}
            required
            defaultValue={existing?.nextFocus ?? ""}
            error={state.errors.next_focus}
          />
          <div className="field">
            <label htmlFor="checkin-energy">Energy this week</label>
            <div className="range-row">
              <input
                id="checkin-energy"
                name="energy"
                type="range"
                min={1}
                max={10}
                step={1}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                aria-valuetext={`${energy} of 10`}
                aria-describedby="checkin-energy-help"
              />
              <output htmlFor="checkin-energy" aria-live="polite">{energy}</output>
            </div>
            {state.errors.energy ? (
              <div className="help err" role="alert">{state.errors.energy}</div>
            ) : (
              <div id="checkin-energy-help" className="help">One is running on empty; ten is the best week of the year.</div>
            )}
          </div>
          <div className="form-actions">
            <SubmitButton pendingText="Logging…">{existing ? "Revise this week" : "Log this week"}</SubmitButton>
          </div>
        </>
      )}
    </Form>
  );
}
