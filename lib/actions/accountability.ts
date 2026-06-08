"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { blockEndDate, clampWeek, BLOCK_WEEKS, type ActionState } from "@/lib/accountability";
import type { CommitmentStatus, PracticeType } from "@/lib/types";

const PRACTICE_TYPES: PracticeType[] = ["NHS", "Private", "Mixed"];

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export type ProfileFormValues = {
  practice_name: string;
  region: string;
  practice_type: string;
  chair_count: string;
};

export type ProfileFormState = {
  ok: boolean;
  message: string | null;
  errors: Partial<Record<keyof ProfileFormValues, string>>;
  values: ProfileFormValues;
};

/**
 * Save the member's practice particulars (master doc Step 1.4).
 * Returns inline state for useActionState — no redirect, no alert. On success
 * the same form re-renders with a confirmation message.
 */
export async function saveAccountabilityProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const practice_name = String(formData.get("practice_name") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const practice_type = String(formData.get("practice_type") ?? "").trim();
  const chairRaw = String(formData.get("chair_count") ?? "").trim();
  const values: ProfileFormValues = { practice_name, region, practice_type, chair_count: chairRaw };

  const errors: ProfileFormState["errors"] = {};
  if (!practice_name) errors.practice_name = "Please enter your practice name.";
  if (!region) errors.region = "Your region places you in the right benchmarking cohort.";
  if (!practice_type) errors.practice_type = "Please choose a practice type.";
  else if (!PRACTICE_TYPES.includes(practice_type as PracticeType))
    errors.practice_type = "Choose NHS, Private or Mixed.";

  let chair_count: number | null = null;
  if (chairRaw) {
    const n = Number(chairRaw);
    if (!Number.isInteger(n) || n < 1 || n > 50)
      errors.chair_count = "Enter a whole number of chairs (1–50).";
    else chair_count = n;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: null, errors, values };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      message: "Your session has expired. Please sign in again.",
      errors: {},
      values,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      practice_name,
      region,
      practice_type: practice_type as PracticeType,
      chair_count,
    })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      message: "We could not save your profile just now. Please try again.",
      errors: {},
      values,
    };
  }

  revalidatePath("/accountability");
  revalidatePath("/accountability/profile");
  return { ok: true, message: "Your practice profile has been saved.", errors: {}, values };
}

/* =============================================================================
 * Step 2.1 — Create a 12-week goal block
 * =========================================================================== */
export async function createGoalBlock(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startDate = String(formData.get("start_date") ?? "").trim();

  const errors: Record<string, string> = {};
  if (!title) errors.title = "Give your block a title.";
  if (!startDate) errors.start_date = "Choose a start date.";
  else if (Number.isNaN(new Date(`${startDate}T00:00:00`).getTime()))
    errors.start_date = "That date doesn't look right.";
  if (Object.keys(errors).length) return { ok: false, message: null, errors };

  const { supabase, userId } = await requireUserId();
  if (!userId) return { ok: false, message: "Your session has expired.", errors: {} };

  const { data, error } = await supabase
    .from("goal_blocks")
    .insert({
      user_id: userId,
      title,
      description,
      start_date: startDate,
      end_date: blockEndDate(startDate),
      status: "active",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, message: "We couldn't create that block.", errors: {} };

  revalidatePath("/accountability/blocks");
  redirect(`/accountability/blocks/${data.id}`);
}

export async function setGoalBlockStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("block_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "completed", "abandoned"].includes(status)) return;
  const { supabase, userId } = await requireUserId();
  if (!userId || !id) return;
  await supabase.from("goal_blocks").update({ status: status as never }).eq("id", id);
  revalidatePath(`/accountability/blocks/${id}`);
  revalidatePath("/accountability/blocks");
}

/* =============================================================================
 * Step 2.2 — Weekly commitments
 * =========================================================================== */
export async function addCommitment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const blockId = String(formData.get("goal_block_id") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const week = clampWeek(Number(formData.get("week_number") ?? 1));

  const errors: Record<string, string> = {};
  if (!blockId) errors.goal_block_id = "Missing block.";
  if (!text) errors.text = "Write what you'll commit to this week.";
  if (Object.keys(errors).length) return { ok: false, message: null, errors };

  const { supabase, userId } = await requireUserId();
  if (!userId) return { ok: false, message: "Your session has expired.", errors: {} };

  const { error } = await supabase.from("commitments").insert({
    goal_block_id: blockId,
    user_id: userId,
    week_number: week,
    text,
    status: "open",
  });
  if (error) return { ok: false, message: "We couldn't add that commitment.", errors: {} };

  revalidatePath(`/accountability/blocks/${blockId}`);
  return { ok: true, message: null, errors: {} };
}

export async function editCommitment(formData: FormData): Promise<void> {
  const id = String(formData.get("commitment_id") ?? "");
  const blockId = String(formData.get("goal_block_id") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const { supabase, userId } = await requireUserId();
  if (!userId || !id || !text) return;
  await supabase.from("commitments").update({ text }).eq("id", id);
  revalidatePath(`/accountability/blocks/${blockId}`);
}

/* =============================================================================
 * Step 2.3 — Commitment status + roll-forward (carry)
 * =========================================================================== */
export async function setCommitmentStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("commitment_id") ?? "");
  const blockId = String(formData.get("goal_block_id") ?? "");
  const status = String(formData.get("status") ?? "") as CommitmentStatus;
  if (!["open", "done", "partial", "missed", "carried"].includes(status)) return;
  const { supabase, userId } = await requireUserId();
  if (!userId || !id) return;
  await supabase.from("commitments").update({ status }).eq("id", id);
  revalidatePath(`/accountability/blocks/${blockId}`);
}

export async function carryCommitment(formData: FormData): Promise<void> {
  const id = String(formData.get("commitment_id") ?? "");
  const blockId = String(formData.get("goal_block_id") ?? "");
  const { supabase, userId } = await requireUserId();
  if (!userId || !id) return;

  const { data: original } = await supabase
    .from("commitments")
    .select("*")
    .eq("id", id)
    .single();
  if (!original || original.week_number >= BLOCK_WEEKS) return;

  // New row in the next week, linked back to the original; original is flagged
  // 'carried' so nothing quietly disappears and the chain stays traceable.
  await supabase.from("commitments").insert({
    goal_block_id: original.goal_block_id,
    user_id: userId,
    week_number: original.week_number + 1,
    text: original.text,
    status: "open",
    carried_from: original.id,
  });
  await supabase.from("commitments").update({ status: "carried" }).eq("id", id);

  revalidatePath(`/accountability/blocks/${blockId}`);
}

/* =============================================================================
 * Step 2.4 — Structured weekly check-in
 * =========================================================================== */
export async function saveCheckIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const didWell = String(formData.get("did_well") ?? "").trim() || null;
  const struggled = String(formData.get("struggled_with") ?? "").trim() || null;
  const focus = String(formData.get("next_week_focus") ?? "").trim() || null;
  const energyRaw = String(formData.get("energy_score") ?? "").trim();
  const weekRaw = String(formData.get("week_number") ?? "").trim();
  const podId = String(formData.get("pod_id") ?? "").trim() || null;

  const errors: Record<string, string> = {};
  if (!didWell && !struggled && !focus)
    errors.did_well = "Note at least one reflection before saving.";

  let energy: number | null = null;
  if (energyRaw) {
    const n = Number(energyRaw);
    if (!Number.isInteger(n) || n < 1 || n > 10) errors.energy_score = "Energy is 1–10.";
    else energy = n;
  }
  if (Object.keys(errors).length) return { ok: false, message: null, errors };

  const { supabase, userId } = await requireUserId();
  if (!userId) return { ok: false, message: "Your session has expired.", errors: {} };

  // Attach the check-in to the member's active pod (if any) so podmates can see
  // it in the shared feed (Step 3.2). An explicit pod_id from the form wins.
  let resolvedPodId = podId;
  if (!resolvedPodId) {
    const { data: membership } = await supabase
      .from("pod_members")
      .select("pod_id")
      .eq("user_id", userId)
      .is("left_at", null)
      .limit(1)
      .maybeSingle();
    resolvedPodId = membership?.pod_id ?? null;
  }

  const { error } = await supabase.from("check_ins").insert({
    user_id: userId,
    pod_id: resolvedPodId,
    week_number: weekRaw ? clampWeek(Number(weekRaw)) : null,
    did_well: didWell,
    struggled_with: struggled,
    next_week_focus: focus,
    energy_score: energy,
  });
  if (error) return { ok: false, message: "We couldn't save your check-in.", errors: {} };

  // Step 2.6 — score updates immediately after a check-in (the nightly cron
  // keeps it fresh thereafter). Failures here must not block the check-in.
  await supabase.rpc("recompute_reliability", { p_user: userId });

  revalidatePath("/accountability/check-in");
  revalidatePath("/accountability");
  return { ok: true, message: "Your check-in is logged. Well kept.", errors: {} };
}

/* =============================================================================
 * Step 2.5 — Win log (no one-tap delete; archive only)
 * =========================================================================== */
export async function logWin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim() || null;
  const blockId = String(formData.get("goal_block_id") ?? "").trim() || null;

  if (!title) return { ok: false, message: null, errors: { title: "What did you win?" } };

  const { supabase, userId } = await requireUserId();
  if (!userId) return { ok: false, message: "Your session has expired.", errors: {} };

  const { error } = await supabase.from("wins").insert({
    user_id: userId,
    goal_block_id: blockId,
    title,
    detail,
  });
  if (error) return { ok: false, message: "We couldn't log that win.", errors: {} };

  revalidatePath("/accountability/wins");
  return { ok: true, message: "Logged. It stays on your record.", errors: {} };
}

export async function archiveWin(formData: FormData): Promise<void> {
  const id = String(formData.get("win_id") ?? "");
  const { supabase, userId } = await requireUserId();
  if (!userId || !id) return;
  await supabase.from("wins").update({ archived_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/accountability/wins");
}

export async function restoreWin(formData: FormData): Promise<void> {
  const id = String(formData.get("win_id") ?? "");
  const { supabase, userId } = await requireUserId();
  if (!userId || !id) return;
  await supabase.from("wins").update({ archived_at: null }).eq("id", id);
  revalidatePath("/accountability/wins");
}
