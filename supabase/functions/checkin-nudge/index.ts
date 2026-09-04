// =============================================================================
// The Principals Club — weekly check-in nudge
//
// Emails each Society member who has NOT completed the current ISO week's
// check-in and has not opted out. Degrades to a clearly-logged no-op when
// RESEND_API_KEY is absent, mirroring the rest of the platform's stub-aware
// integrations.
//
// Invoke on a weekly schedule via pg_cron + pg_net (see ./schedule.sql). The
// caller must present the service-role key as a bearer token.
// =============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:3000";
const FROM_EMAIL = Deno.env.get("NUDGE_FROM_EMAIL") ?? "The Principals Club <no-reply@theprincipalsclub.co.uk>";

/** The largest page we will read in one go; the Club is far smaller than this. */
const MAX_ROWS = 4999;

/** "2026-W36" for the ISO week containing `now` (UTC), matching lib/weeks.ts. */
function isoWeekKey(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7; // Monday = 1 … Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - day); // the Thursday decides the ISO year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Constant-time comparison so a wrong key does not leak by timing. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i += 1) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function sendEmail(to: string, name: string): Promise<"sent" | "stubbed" | "failed"> {
  const checkInUrl = `${SITE_URL}/check-in`;
  if (!RESEND_API_KEY) {
    console.log(`[checkin-nudge] STUB email → ${to} (no RESEND_API_KEY). Link: ${checkInUrl}`);
    return "stubbed";
  }
  const greeting = name ? `Dear ${name},` : "Dear member,";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject: "Your weekly check-in is waiting",
      text:
        `${greeting}\n\n` +
        `A short, structured reflection keeps your streak and your standing. ` +
        `It takes two minutes and you never face a blank page.\n\n` +
        `Check in: ${checkInUrl}\n\n` +
        `— The Principals Club`,
    }),
  });
  if (!res.ok) {
    console.error(`[checkin-nudge] Resend failed for ${to}: ${res.status} ${await res.text()}`);
    return "failed";
  }
  return "sent";
}

Deno.serve(async (req) => {
  // Only the scheduler (or an operator with the service key) may run this.
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (!SERVICE_ROLE_KEY || !token || !timingSafeEqual(token, SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const weekKey = isoWeekKey();

  // Society members who have not opted out of the nudge.
  const { data: members, error: membersErr } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("tier", "society")
    .eq("nudge_opt_out", false)
    .range(0, MAX_ROWS);
  if (membersErr) {
    return new Response(JSON.stringify({ error: membersErr.message }), { status: 500 });
  }

  // Who has already checked in this week?
  const { data: weekCheckIns, error: ciErr } = await supabase
    .from("check_ins")
    .select("user_id")
    .eq("week_key", weekKey)
    .range(0, MAX_ROWS);
  if (ciErr) {
    return new Response(JSON.stringify({ error: ciErr.message }), { status: 500 });
  }
  const checkedIn = new Set((weekCheckIns ?? []).map((c) => c.user_id));

  const due = (members ?? []).filter((m) => !checkedIn.has(m.id));

  // Profiles carry the email from sign-up; fall back to auth.users for any
  // that were created before that was recorded.
  const emailById = new Map<string, string>();
  for (const m of due) if (m.email) emailById.set(m.id, m.email);
  if (due.some((m) => !emailById.has(m.id))) {
    const { data: usersPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of usersPage?.users ?? []) {
      if (u.email && !emailById.has(u.id)) emailById.set(u.id, u.email);
    }
  }

  const summary = { week: weekKey, due: due.length, sent: 0, stubbed: 0, failed: 0, skipped_no_email: 0 };
  for (const m of due) {
    const email = emailById.get(m.id);
    if (!email) {
      summary.skipped_no_email += 1;
      continue;
    }
    const outcome = await sendEmail(email, (m.full_name ?? "").trim());
    summary[outcome] += 1;
  }

  console.log(`[checkin-nudge] ${JSON.stringify(summary)}`);
  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
  });
});
