"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createGoogleEvent, createMicrosoftEvent } from "@/lib/integrations/calendar";
import { formatAppointment } from "@/lib/cadence";
import type { CalendarProvider, Meeting } from "@/lib/types";

export async function disconnectCalendar(provider: CalendarProvider): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("calendar_connections")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider);

  revalidatePath("/calendar");
}

/**
 * Best-effort push of a meeting to the current member's connected calendars.
 * No-op when no calendar is connected. Records provider event ids on the
 * meeting so they can later be updated or removed.
 */
export async function syncMeetingToCalendars(meeting: Meeting): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: connections } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("user_id", user.id);

  if (!connections || connections.length === 0) return;

  const start = new Date(meeting.scheduled_at);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  const ev = {
    summary: "The Principals Club — Accountability Sitting",
    description: `Your standing appointment. ${formatAppointment(meeting.scheduled_at)}.`,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };

  const patch: Partial<Meeting> = {};
  for (const conn of connections) {
    if (!conn.access_token) continue;
    if (conn.provider === "google") {
      const id = await createGoogleEvent(conn.access_token, ev);
      if (id) patch.google_event_id = id;
    } else if (conn.provider === "microsoft") {
      const id = await createMicrosoftEvent(conn.access_token, ev);
      if (id) patch.microsoft_event_id = id;
    }
  }

  if (Object.keys(patch).length > 0) {
    await supabase.from("meetings").update(patch).eq("id", meeting.id);
  }
}
