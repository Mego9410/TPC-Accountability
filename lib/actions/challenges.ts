"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { blockEndDate } from "@/lib/accountability";
import type { ActionState } from "@/lib/accountability";

async function getAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "house" ? user.id : null;
}

/** Create a club-wide challenge (admin only). */
export async function createChallenge(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDateRaw = String(formData.get("end_date") ?? "").trim();

  const errors: Record<string, string> = {};
  if (!title) errors.title = "Name the challenge.";
  if (!startDate) errors.start_date = "Choose a start date.";
  if (Object.keys(errors).length) return { ok: false, message: null, errors };

  const adminId = await getAdminId();
  if (!adminId) return { ok: false, message: "Administrators only.", errors: {} };

  // Default to a 12-week sprint when no end date is given.
  const endDate = endDateRaw || blockEndDate(startDate);

  const svc = createServiceClient();
  const { error } = await svc
    .from("challenges")
    .insert({ title, description, start_date: startDate, end_date: endDate });
  if (error) return { ok: false, message: "We couldn't create that challenge.", errors: {} };

  revalidatePath("/accountability/challenges");
  return { ok: true, message: "Challenge created.", errors: {} };
}

export async function joinChallenge(formData: FormData): Promise<void> {
  const challengeId = String(formData.get("challenge_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !challengeId) return;
  await supabase
    .from("challenge_participants")
    .upsert(
      { challenge_id: challengeId, user_id: user.id, progress: 0 },
      { onConflict: "challenge_id,user_id", ignoreDuplicates: true },
    );
  revalidatePath("/accountability/challenges");
}

export async function leaveChallenge(formData: FormData): Promise<void> {
  const challengeId = String(formData.get("challenge_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !challengeId) return;
  await supabase
    .from("challenge_participants")
    .delete()
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id);
  revalidatePath("/accountability/challenges");
}

export async function updateChallengeProgress(formData: FormData): Promise<void> {
  const challengeId = String(formData.get("challenge_id") ?? "");
  const progress = Number(formData.get("progress") ?? 0);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !challengeId || Number.isNaN(progress)) return;
  await supabase
    .from("challenge_participants")
    .update({ progress: Math.max(0, progress) })
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id);
  revalidatePath("/accountability/challenges");
}

export async function setLeaderboardOptIn(formData: FormData): Promise<void> {
  const challengeId = String(formData.get("challenge_id") ?? "");
  const optIn = String(formData.get("opt_in") ?? "") === "true";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !challengeId) return;
  await supabase
    .from("challenge_participants")
    .update({ leaderboard_opt_in: optIn })
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id);
  revalidatePath("/accountability/challenges");
}
