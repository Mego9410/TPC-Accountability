"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { runMatchmaking } from "@/lib/actions/matching";
import type { Cadence } from "@/lib/types";

const CADENCES: Cadence[] = ["weekly", "fortnightly", "monthly"];

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveOnboarding(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const honorific = String(formData.get("honorific") ?? "").trim() || null;
  const practiceName = String(formData.get("practice_name") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const timezone = String(formData.get("timezone") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;

  const cadenceRaw = String(formData.get("cadence") ?? "monthly");
  const cadence: Cadence = CADENCES.includes(cadenceRaw as Cadence)
    ? (cadenceRaw as Cadence)
    : "monthly";

  const focusAreas = formData.getAll("focus").map(String).filter(Boolean);
  const preferredTimes = formData.getAll("times").map(String).filter(Boolean);
  const interests = splitList(String(formData.get("interests") ?? ""));

  await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      honorific,
      practice_name: practiceName,
      location,
      timezone,
      bio,
      onboarded: true,
    })
    .eq("id", user.id);

  // Upsert preferences and (re)enter the matching queue.
  const { data: existing } = await supabase
    .from("match_preferences")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("match_preferences")
      .update({
        focus_areas: focusAreas,
        interests,
        cadence,
        preferred_times: preferredTimes,
      })
      .eq("user_id", user.id);
  } else {
    await supabase.from("match_preferences").insert({
      user_id: user.id,
      focus_areas: focusAreas,
      interests,
      cadence,
      preferred_times: preferredTimes,
      status: "queued",
    });
  }

  await runMatchmaking(user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
