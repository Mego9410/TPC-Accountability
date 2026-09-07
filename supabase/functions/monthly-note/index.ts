// =============================================================================
// The Principals Club — the monthly note
//
// Once a month, one email to each member who has a partner and something open
// they said they were working on: how are the goals getting on? It asks for a
// line against them, and links to /goals. Nothing else — no streaks, no weeks,
// no scores. A member who would rather not have it sets nudge_opt_out.
//
// Degrades to a clearly-logged no-op when RESEND_API_KEY is absent, mirroring
// the rest of the platform's stub-aware integrations.
//
// Invoke on a monthly schedule via pg_cron + pg_net (see ./schedule.sql). The
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

/** "Dr Cheng" from a full name, matching `address()` in lib/domain.ts. */
function address(fullName: string, honorific: string): string {
  const name = fullName.trim();
  if (!name) return "Principal";
  const parts = name.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "").trim().split(/\s+/);
  const surname = parts[parts.length - 1];
  return `${(honorific || "Dr").replace(/\.$/, "")} ${surname}`;
}

async function sendEmail(
  to: string,
  salutation: string,
  openGoals: number,
): Promise<"sent" | "stubbed" | "failed"> {
  const goalsUrl = `${SITE_URL}/goals`;
  if (!RESEND_API_KEY) {
    console.log(`[monthly-note] STUB email → ${to} (no RESEND_API_KEY). Link: ${goalsUrl}`);
    return "stubbed";
  }
  const count = openGoals === 1 ? "the goal you have open" : `the ${openGoals} goals you have open`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject: "How are the goals getting on?",
      text:
        `Dear ${salutation},\n\n` +
        `A line, once a month, on ${count}. Not a report — a sentence will do, ` +
        `and your partner will see it.\n\n` +
        `${goalsUrl}\n\n` +
        `— The Principals Club`,
    }),
  });
  if (!res.ok) {
    console.error(`[monthly-note] Resend failed for ${to}: ${res.status} ${await res.text()}`);
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

  // Members who have not opted out. The House does not get the note.
  const { data: members, error: membersErr } = await supabase
    .from("profiles")
    .select("id, honorific, full_name, email")
    .eq("role", "member")
    .eq("nudge_opt_out", false)
    .range(0, MAX_ROWS);
  if (membersErr) {
    return new Response(JSON.stringify({ error: membersErr.message }), { status: 500 });
  }

  // Who currently has a partner? The note only makes sense with someone to
  // read the answer.
  const { data: partnerships, error: partnersErr } = await supabase
    .from("partnerships")
    .select("a_id, b_id")
    .eq("status", "active")
    .range(0, MAX_ROWS);
  if (partnersErr) {
    return new Response(JSON.stringify({ error: partnersErr.message }), { status: 500 });
  }
  const partnered = new Set<string>();
  for (const p of partnerships ?? []) {
    partnered.add(p.a_id);
    partnered.add(p.b_id);
  }

  // And who has something open to be asked about?
  const { data: openGoals, error: goalsErr } = await supabase
    .from("goals")
    .select("user_id")
    .eq("status", "open")
    .range(0, MAX_ROWS);
  if (goalsErr) {
    return new Response(JSON.stringify({ error: goalsErr.message }), { status: 500 });
  }
  const openByUser = new Map<string, number>();
  for (const g of openGoals ?? []) {
    openByUser.set(g.user_id, (openByUser.get(g.user_id) ?? 0) + 1);
  }

  const due = (members ?? []).filter((m) => partnered.has(m.id) && (openByUser.get(m.id) ?? 0) > 0);

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

  const summary = {
    month: new Date().toISOString().slice(0, 7),
    due: due.length,
    sent: 0,
    stubbed: 0,
    failed: 0,
    skipped_no_email: 0,
  };
  for (const m of due) {
    const email = emailById.get(m.id);
    if (!email) {
      summary.skipped_no_email += 1;
      continue;
    }
    const outcome = await sendEmail(
      email,
      address(m.full_name ?? "", m.honorific ?? "Dr"),
      openByUser.get(m.id) ?? 1,
    );
    summary[outcome] += 1;
  }

  console.log(`[monthly-note] ${JSON.stringify(summary)}`);
  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
  });
});
