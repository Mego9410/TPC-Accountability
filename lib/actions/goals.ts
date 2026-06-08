"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ExtractedGoal } from "@/lib/integrations/goals-ai";

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function addGoal(formData: FormData): Promise<void> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return;

  const partnershipId = String(formData.get("partnership_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim() || null;
  if (!partnershipId || !title) return;

  await supabase.from("goals").insert({
    partnership_id: partnershipId,
    owner_id: userId,
    title,
    detail,
    source: "manual",
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function toggleGoal(goalId: string, done: boolean): Promise<void> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return;

  await supabase
    .from("goals")
    .update({
      status: done ? "done" : "open",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", goalId);

  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return;
  await supabase.from("goals").delete().eq("id", goalId);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

/** Persist goals confirmed by the member from a transcript extraction. */
export async function saveExtractedGoals(
  partnershipId: string,
  meetingId: string | null,
  goals: ExtractedGoal[],
): Promise<void> {
  const { supabase, userId } = await currentUserId();
  if (!userId || goals.length === 0) return;

  await supabase.from("goals").insert(
    goals.map((g) => ({
      partnership_id: partnershipId,
      owner_id: userId,
      meeting_id: meetingId,
      title: g.title,
      detail: g.detail || null,
      source: "transcript" as const,
    })),
  );

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  if (meetingId) revalidatePath(`/meetings/${meetingId}`);
}
