"use client";

import { useActionState } from "react";
import { Button, Field, cn } from "@/components/ui";
import {
  saveAccountabilityProfile,
  type ProfileFormState,
  type ProfileFormValues,
} from "@/lib/actions/accountability";

const PRACTICE_TYPES = ["NHS", "Private", "Mixed"] as const;

export function ProfileSetupForm({ defaults }: { defaults: ProfileFormValues }) {
  const initial: ProfileFormState = { ok: false, message: null, errors: {}, values: defaults };
  const [state, formAction, pending] = useActionState(saveAccountabilityProfile, initial);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {state.ok && state.message && (
        <div className="notice" role="status">
          {state.message}
        </div>
      )}
      {!state.ok && state.message && (
        <div className="notice" role="alert" style={{ borderColor: "var(--danger, #b4452f)" }}>
          {state.message}
        </div>
      )}

      <Field
        label="Practice name"
        name="practice_name"
        placeholder="Cheng Dental, Marylebone"
        defaultValue={defaults.practice_name}
        error={state.errors.practice_name}
        aria-invalid={Boolean(state.errors.practice_name)}
      />

      <div className="grid-even">
        <Field
          label="Region"
          name="region"
          placeholder="London"
          defaultValue={defaults.region}
          help="Used to place you in a like-for-like benchmarking cohort."
          error={state.errors.region}
          aria-invalid={Boolean(state.errors.region)}
        />

        <div className={cn("field")}>
          <label htmlFor="practice_type">Practice type</label>
          <select
            id="practice_type"
            name="practice_type"
            defaultValue={defaults.practice_type}
            aria-invalid={Boolean(state.errors.practice_type)}
          >
            <option value="">Choose one…</option>
            {PRACTICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {state.errors.practice_type && (
            <div className="help err">{state.errors.practice_type}</div>
          )}
        </div>
      </div>

      <Field
        label="Number of chairs"
        name="chair_count"
        type="number"
        min={1}
        max={50}
        step={1}
        placeholder="4"
        defaultValue={defaults.chair_count}
        help="Optional. Helps cohort by practice scale."
        error={state.errors.chair_count}
        aria-invalid={Boolean(state.errors.chair_count)}
        style={{ maxWidth: 200 }}
      />

      <div className="row" style={{ marginTop: 4 }}>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save your profile"}
        </Button>
      </div>
    </form>
  );
}
