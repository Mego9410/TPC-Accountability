"use client";

import { useState, useTransition } from "react";
import { toggleGoal, deleteGoal } from "@/lib/actions/goals";
import type { Goal } from "@/lib/types";

export function GoalList({
  goals,
  canEdit,
  showDelete,
  demo,
}: {
  goals: Goal[];
  canEdit: boolean;
  showDelete?: boolean;
  demo?: boolean;
}) {
  if (goals.length === 0) {
    return <p className="caption">Nothing set down yet.</p>;
  }
  return (
    <div className="stack">
      {goals.map((g) => (
        <GoalRow key={g.id} goal={g} canEdit={canEdit} showDelete={showDelete} demo={demo} />
      ))}
    </div>
  );
}

function GoalRow({
  goal,
  canEdit,
  showDelete,
  demo,
}: {
  goal: Goal;
  canEdit: boolean;
  showDelete?: boolean;
  demo?: boolean;
}) {
  const [done, setDone] = useState(goal.status === "done");
  const [removed, setRemoved] = useState(false);
  const [, startTransition] = useTransition();

  if (removed) return null;

  function onToggle() {
    if (!canEdit) return;
    const next = !done;
    setDone(next);
    if (demo) return;
    startTransition(() => toggleGoal(goal.id, next));
  }

  function onDelete() {
    setRemoved(true);
    if (demo) return;
    startTransition(() => deleteGoal(goal.id));
  }

  return (
    <div className="goal">
      <button
        type="button"
        className={`check${done ? " done" : ""}`}
        onClick={onToggle}
        aria-pressed={done}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        disabled={!canEdit}
        style={!canEdit ? { cursor: "default" } : undefined}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M5 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className={`text${done ? " done" : ""}`}>
        <div className="t">{goal.title}</div>
        {goal.detail && <div className="d">{goal.detail}</div>}
      </div>
      {showDelete && canEdit && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Remove goal"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-on-paper-muted)",
            font: "500 10px/1 var(--font-sans)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
}
