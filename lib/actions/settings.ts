"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { runMatchmaking } from "@/lib/actions/matching";
import { env } from "@/lib/env";
import type { Cadence } from "@/lib/types";

const CADENCES: Cadence[] = ["weekly", "fortnightly", "monthly"];

function splitList(value: string): string[] {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function updateParticulars(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cadenceRaw = String(formData.get("cadence") ?? "monthly");
  const cadence: Cadence = CADENCES.includes(cadenceRaw as Cadence)
    ? (cadenceRaw as Cadence)
    : "monthly";

  await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? "").trim() || null,
      honorific: String(formData.get("honorific") ?? "").trim() || null,
      practice_name: String(formData.get("practice_name") ?? "").trim() || null,
      location: String(formData.get("location") ?? "").trim() || null,
      timezone: String(formData.get("timezone") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
    })
    .eq("id", user.id);

  await supabase
    .from("match_preferences")
    .update({
      focus_areas: formData.getAll("focus").map(String).filter(Boolean),
      preferred_times: formData.getAll("times").map(String).filter(Boolean),
      interests: splitList(String(formData.get("interests") ?? "")),
      cadence,
    })
    .eq("user_id", user.id);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function endPartnership(partnershipId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("partnerships")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", partnershipId);

  if (env.supabase.serviceRoleKey) {
    const admin = createServiceClient();
    const { data: p } = await admin
      .from("partnerships")
      .select("member_a, member_b")
      .eq("id", partnershipId)
      .maybeSingle();
    if (p) {
      await admin
        .from("match_preferences")
        .update({ status: "queued" })
        .in("user_id", [p.member_a, p.member_b]);
      await runMatchmaking(user.id);
    }
  } else {
    await supabase
      .from("match_preferences")
      .update({ status: "queued" })
      .eq("user_id", user.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/dashboard");
}
