"use client";

import { QuickAction } from "@/components/ui/form";
import { carryCommitment, setCommitmentStatus } from "@/lib/actions/blocks";

/** Kept / Partly / Missed / Carry — the four things you can say about an open commitment. */
export function CommitmentQuickActions({ id, canCarry = true, compact }: { id: string; canCarry?: boolean; compact?: boolean }) {
  return (
    <>
      <QuickAction action={setCommitmentStatus} fields={{ commitment_id: id, status: "done" }} variant="secondary" size="sm">Kept</QuickAction>
      {!compact && <QuickAction action={setCommitmentStatus} fields={{ commitment_id: id, status: "partial" }}>Partly</QuickAction>}
      <QuickAction action={setCommitmentStatus} fields={{ commitment_id: id, status: "missed" }}>Missed</QuickAction>
      {canCarry && <QuickAction action={carryCommitment} fields={{ commitment_id: id }}>Carry</QuickAction>}
    </>
  );
}

export function ReopenCommitment({ id }: { id: string }) {
  return <QuickAction action={setCommitmentStatus} fields={{ commitment_id: id, status: "open" }}>Reopen</QuickAction>;
}
