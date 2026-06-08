import "server-only";
import { env } from "@/lib/env";

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  accountEmail: string | null;
}

export interface CalendarEventInput {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
}

/* ============================== Google ============================== */

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "openid",
      "email",
      "profile",
    ].join(" "),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<OAuthTokens> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: env.google.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  let email: string | null = null;
  try {
    const ui = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (ui.ok) email = ((await ui.json()) as { email?: string }).email ?? null;
  } catch {
    /* ignore */
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
    accountEmail: email,
  };
}

export async function createGoogleEvent(
  accessToken: string,
  ev: CalendarEventInput,
): Promise<string | null> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: ev.summary,
        description: ev.description,
        start: { dateTime: ev.startIso },
        end: { dateTime: ev.endIso },
      }),
    },
  );
  if (!res.ok) return null;
  return ((await res.json()) as { id?: string }).id ?? null;
}

/* ============================ Microsoft ============================ */

export function microsoftAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.microsoft.clientId,
    redirect_uri: env.microsoft.redirectUri,
    response_type: "code",
    response_mode: "query",
    scope: [
      "offline_access",
      "openid",
      "email",
      "profile",
      "Calendars.ReadWrite",
    ].join(" "),
    state,
  });
  return `https://login.microsoftonline.com/${env.microsoft.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeMicrosoftCode(code: string): Promise<OAuthTokens> {
  const res = await fetch(
    `https://login.microsoftonline.com/${env.microsoft.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.microsoft.clientId,
        client_secret: env.microsoft.clientSecret,
        redirect_uri: env.microsoft.redirectUri,
        grant_type: "authorization_code",
      }),
    },
  );
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  let email: string | null = null;
  try {
    const me = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (me.ok) {
      const j = (await me.json()) as { mail?: string; userPrincipalName?: string };
      email = j.mail ?? j.userPrincipalName ?? null;
    }
  } catch {
    /* ignore */
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
    accountEmail: email,
  };
}

export async function createMicrosoftEvent(
  accessToken: string,
  ev: CalendarEventInput,
): Promise<string | null> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: ev.summary,
      body: { contentType: "text", content: ev.description },
      start: { dateTime: ev.startIso, timeZone: "UTC" },
      end: { dateTime: ev.endIso, timeZone: "UTC" },
    }),
  });
  if (!res.ok) return null;
  return ((await res.json()) as { id?: string }).id ?? null;
}
