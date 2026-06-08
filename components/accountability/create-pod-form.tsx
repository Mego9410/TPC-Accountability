"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Field } from "@/components/ui";
import { createPod } from "@/lib/actions/pods";
import { EMPTY_ACTION_STATE } from "@/lib/accountability";

export function CreatePodForm() {
  const [state, formAction, pending] = useActionState(createPod, EMPTY_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      {state.ok && state.message && (
        <div className="notice" role="status" style={{ flexBasis: "100%" }}>
          {state.message}
        </div>
      )}
      {!state.ok && state.message && (
        <div className="notice" role="alert" style={{ flexBasis: "100%" }}>
          {state.message}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 200 }}>
        <Field
          label="Pod name"
          name="name"
          placeholder="The Marylebone Six"
          error={state.errors.name}
          aria-invalid={Boolean(state.errors.name)}
        />
      </div>
      <div style={{ width: 160 }}>
        <Field label="Cohort label" name="cohort_label" placeholder="2026 Q3" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Create pod"}
      </Button>
    </form>
  );
}
