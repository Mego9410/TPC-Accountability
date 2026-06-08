import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { nextOccurrence } from "@/lib/cadence";
import type { Cadence } from "@/lib/types";

export interface MatchOutcome {
  matched: boolean;
  partnershipId?: string;
  reason?: "queued" | "no-service-role" | "matched";
}

/**
 * Attempt to pair a queued member with another queued member.
 *
 * Runs with the service-role client so it can read the full queue and write a
 * partnership for two users (ordinary RLS would forbid this). Pairing is FIFO,
 * preferring the same cadence, then falling back to any waiting member.
 */
export async function runMatchmaking(userId: string): Promise<MatchOutcome> {
  if (!env.supabase.serviceRoleKey) {
    return { matched: false, reason: "no-service-role" };
  }

  const admin = createServiceClient();

  const { data: mine } = await admin
    .from("match_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!mine || mine.status !== "queued") {
    return { matched: false, reason: "matched" };
  }

  // Candidates: other queued members, oldest first.
  const { data: candidates } = await admin
    .from("match_preferences")
    .select("*")
    .eq("status", "queued")
    .neq("user_id", userId)
    .order("created_at", { ascending: true });

  const pool = candidates ?? [];
  if (pool.length === 0) {
    return { matched: false, reason: "queued" };
  }

  const sameCadence = pool.find((c) => c.cadence === mine.cadence);
  const partnerPref = sameCadence ?? pool[0];
  const cadence: Cadence = (sameCadence ? mine.cadence : mine.cadence) as Cadence;

  const { data: partnership, error } = await admin
    .from("partnerships")
    .insert({ member_a: userId, member_b: partnerPref.user_id, cadence })
    .select("id")
    .single();

  if (error || !partnership) {
    return { matched: false, reason: "queued" };
  }

  await admin
    .from("match_preferences")
    .update({ status: "matched" })
    .in("user_id", [userId, partnerPref.user_id]);

  // Hold the first appointment one cadence-interval out, at half past six.
  const when = nextOccurrence(new Date(), cadence);
  when.setHours(18, 30, 0, 0);
  await admin.from("meetings").insert({
    partnership_id: partnership.id,
    scheduled_at: when.toISOString(),
    cadence,
    created_by: userId,
  });

  return { matched: true, partnershipId: partnership.id, reason: "matched" };
}
