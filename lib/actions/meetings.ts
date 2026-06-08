"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createDailyRoom } from "@/lib/integrations/video";
import { nextOccurrence } from "@/lib/cadence";
import { syncMeetingToCalendars } from "@/lib/actions/calendar";
import type { Cadence, Meeting } from "@/lib/types";

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function scheduleMeeting(formData: FormData): Promise<void> {
  const { supabase, userId } = await ctx();
  if (!userId) return;

  const partnershipId = String(formData.get("partnership_id") ?? "");
  const local = String(formData.get("scheduled_at") ?? "");
  const cadence = (String(formData.get("cadence") ?? "monthly") as Cadence) ?? "monthly";
  if (!partnershipId || !local) return;

  const scheduledAt = new Date(local).toISOString();

  const { data: meeting } = await supabase
    .from("meetings")
    .insert({
      partnership_id: partnershipId,
      scheduled_at: scheduledAt,
      cadence,
      created_by: userId,
    })
    .select("*")
    .single();

  if (meeting) {
    await syncMeetingToCalendars(meeting as Meeting);
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

/**
 * Ensure a Daily room exists for a meeting, creating one on demand.
 * Returns the room URL (or null in stub mode).
 */
export async function ensureMeetingRoom(meetingId: string): Promise<{
  url: string | null;
  stub: boolean;
}> {
  const { supabase, userId } = await ctx();
  if (!userId) return { url: null, stub: true };

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .maybeSingle();
  if (!meeting) return { url: null, stub: true };

  if (meeting.daily_room_url) {
    return { url: meeting.daily_room_url, stub: false };
  }

  const room = await createDailyRoom(meetingId);
  if (room.url) {
    await supabase
      .from("meetings")
      .update({ daily_room_url: room.url, daily_room_name: room.name })
      .eq("id", meetingId);
  }
  return { url: room.url, stub: room.stub };
}

export async function completeMeeting(meetingId: string): Promise<void> {
  const { supabase, userId } = await ctx();
  if (!userId) return;

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .maybeSingle();
  if (!meeting) return;

  await supabase.from("meetings").update({ status: "completed" }).eq("id", meetingId);

  // Hold the next sitting one cadence-interval onward.
  const next = nextOccurrence(new Date(meeting.scheduled_at), meeting.cadence as Cadence);
  await supabase.from("meetings").insert({
    partnership_id: meeting.partnership_id,
    scheduled_at: next.toISOString(),
    cadence: meeting.cadence,
    created_by: userId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath(`/meetings/${meetingId}`);
}

export async function cancelMeeting(meetingId: string): Promise<void> {
  const { supabase, userId } = await ctx();
  if (!userId) return;
  await supabase.from("meetings").update({ status: "cancelled" }).eq("id", meetingId);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}
