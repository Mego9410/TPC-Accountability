import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { isPreviewMode } from "@/lib/preview";
import { demoProfile, DEMO_USER_ID } from "@/lib/demo";
import type { Profile } from "@/lib/types";

/**
 * Resolve the signed-in user and their profile. Ensures a profile row exists
 * (a DB trigger normally creates it; this is a defensive fallback).
 * Redirects to /login when there is no session.
 */
export async function requireUserProfile(): Promise<{
  userId: string;
  email: string | null;
  profile: Profile;
}> {
  // Preview (bypass) tour — furnished demo data, no real session required.
  if (await isPreviewMode()) {
    return { userId: DEMO_USER_ID, email: "guest@preview", profile: demoProfile };
  }

  if (!env.supabase.isConfigured) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null;
    const { data: created } = await supabase
      .from("profiles")
      .insert({ id: user.id, full_name: fullName })
      .select("*")
      .single();
    profile = created ?? null;
  }

  if (!profile) {
    // Schema not migrated yet — surface a clear path rather than a crash.
    redirect("/login?error=schema");
  }

  return { userId: user.id, email: user.email ?? null, profile };
}

export function initials(name: string | null | undefined): string {
  if (!name) return "P";
  const parts = name.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "").trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "P";
}

/** "Dr. Cheng" style address from a full name. */
export function surnameAddress(profile: Profile): string {
  const name = profile.full_name?.trim();
  if (!name) return "Principal";
  const honorificMatch = name.match(/^(dr|mr|mrs|ms|prof)\.?\s+/i);
  const parts = name.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "").trim().split(/\s+/);
  const surname = parts[parts.length - 1];
  const honorific = profile.honorific || (honorificMatch ? honorificMatch[1] : "Dr");
  const clean = honorific.replace(/\.$/, "");
  return `${clean}. ${surname}`;
}
