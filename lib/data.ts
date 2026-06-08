import { createClient } from "@/lib/supabase/server";
import { isPreviewMode } from "@/lib/preview";
import {
  demoGoals,
  demoMeetings,
  demoMessages,
  demoPartnership,
} from "@/lib/demo";
import type {
  Goal,
  Meeting,
  Message,
  Partnership,
  PartnershipWithPartner,
  Profile,
} from "@/lib/types";

export async function getActivePartnership(
  userId: string,
): Promise<PartnershipWithPartner | null> {
  if (await isPreviewMode()) return demoPartnership;
  const supabase = await createClient();
  const { data: partnership } = await supabase
    .from("partnerships")
    .select("*")
    .eq("status", "active")
    .or(`member_a.eq.${userId},member_b.eq.${userId}`)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (!partnership) return null;

  const partnerId =
    partnership.member_a === userId ? partnership.member_b : partnership.member_a;
  const { data: partner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", partnerId)
    .maybeSingle();

  if (!partner) return null;
  return { ...(partnership as Partnership), partner: partner as Profile };
}

export async function getGoals(partnershipId: string): Promise<Goal[]> {
  if (await isPreviewMode()) return demoGoals;
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("partnership_id", partnershipId)
    .order("created_at", { ascending: false });
  return (data as Goal[]) ?? [];
}

export async function getUpcomingMeetings(partnershipId: string): Promise<Meeting[]> {
  if (await isPreviewMode()) return demoMeetings;
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select("*")
    .eq("partnership_id", partnershipId)
    .order("scheduled_at", { ascending: true });
  return (data as Meeting[]) ?? [];
}

export async function getNextMeeting(partnershipId: string): Promise<Meeting | null> {
  if (await isPreviewMode()) {
    return (
      demoMeetings
        .filter((m) => m.status === "scheduled" && new Date(m.scheduled_at) >= new Date())
        .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))[0] ?? null
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select("*")
    .eq("partnership_id", partnershipId)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as Meeting) ?? null;
}

export async function getMessages(partnershipId: string): Promise<Message[]> {
  if (await isPreviewMode()) return demoMessages;
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("partnership_id", partnershipId)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data as Message[]) ?? [];
}

export async function getUnreadCount(
  partnershipId: string,
  userId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("partnership_id", partnershipId)
    .neq("sender_id", userId)
    .is("read_at", null);
  return count ?? 0;
}
