import "server-only";
import { env } from "@/lib/env";

export interface RoomResult {
  url: string | null;
  name: string;
  stub: boolean;
}

/**
 * Create a Daily.co room for a meeting. When DAILY_API_KEY is absent we return
 * a clearly-marked stub so the meeting surface remains navigable; the UI shows
 * a setup placeholder in place of the live call.
 */
export async function createDailyRoom(meetingId: string): Promise<RoomResult> {
  const name = `tpc-${meetingId.slice(0, 8)}`;

  if (!env.daily.isConfigured) {
    return { url: null, name, stub: true };
  }

  const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 6; // 6 hours
  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.daily.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      privacy: "private",
      properties: {
        exp: expiry,
        enable_chat: true,
        enable_recording: "cloud",
        enable_transcription: true,
      },
    }),
  });

  if (!res.ok) {
    // Room may already exist; try to fetch it before giving up.
    const existing = await fetch(`https://api.daily.co/v1/rooms/${name}`, {
      headers: { Authorization: `Bearer ${env.daily.apiKey}` },
    });
    if (existing.ok) {
      const data = (await existing.json()) as { url: string; name: string };
      return { url: data.url, name: data.name, stub: false };
    }
    return { url: null, name, stub: true };
  }

  const data = (await res.json()) as { url: string; name: string };
  return { url: data.url, name: data.name, stub: false };
}

/** Short-lived meeting token so members join with their name. */
export async function createMeetingToken(
  roomName: string,
  userName: string,
): Promise<string | null> {
  if (!env.daily.isConfigured) return null;
  const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.daily.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties: { room_name: roomName, user_name: userName } }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { token: string };
  return data.token;
}
