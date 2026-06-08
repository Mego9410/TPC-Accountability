// =============================================================================
// The Principals Club — weekly check-in nudge (master doc Step 2.7)
//
// Emails each paid member who has NOT completed the current ISO week's check-in
// and has not opted out. Degrades to a clearly-logged no-op when RESEND_API_KEY
// is absent, mirroring the rest of the platform's stub-aware integrations.
//
// Invoke on a weekly schedule via pg_cron + pg_net (see ./schedule.sql).
// =============================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:3000";
const FROM_EMAIL = Deno.env.get("NUDGE_FROM_EMAIL") ?? "The Principals Club <no-reply@theprincipalsclub.co.uk>";

/** Monday 00:00 UTC of the current ISO week. */
function startOfIsoWeekUTC(now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

async function sendEmail(to: string, name: string): Promise<"sent" | "stubbed" | "failed"> {
  const checkInUrl = `${SITE_URL}/accountability/check-in`;
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

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const weekStart = startOfIsoWeekUTC().toISOString();

  // Paid members who have not opted out of the nudge.
  const { data: members, error: membersErr } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_paid_member", true)
    .eq("checkin_nudge_opt_out", false);
  if (membersErr) {
    return new Response(JSON.stringify({ error: membersErr.message }), { status: 500 });
  }

  // Who has already checked in this week?
  const { data: weekCheckIns, error: ciErr } = await supabase
    .from("check_ins")
    .select("user_id")
    .gte("completed_at", weekStart);
  if (ciErr) {
    return new Response(JSON.stringify({ error: ciErr.message }), { status: 500 });
  }
  const checkedIn = new Set((weekCheckIns ?? []).map((c) => c.user_id));

  const due = (members ?? []).filter((m) => !checkedIn.has(m.id));

  // Resolve emails from auth.users via the admin API.
  const { data: usersPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map<string, string>();
  for (const u of usersPage?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email);
  }

  const summary = { due: due.length, sent: 0, stubbed: 0, failed: 0, skipped_no_email: 0 };
  for (const m of due) {
    const email = emailById.get(m.id);
    if (!email) {
      summary.skipped_no_email += 1;
      continue;
    }
    const outcome = await sendEmail(email, (m.full_name ?? "").trim());
    summary[outcome === "sent" ? "sent" : outcome === "stubbed" ? "stubbed" : "failed"] += 1;
  }

  console.log(`[checkin-nudge] ${JSON.stringify(summary)}`);
  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
  });
});
