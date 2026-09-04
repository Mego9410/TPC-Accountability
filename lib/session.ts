import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import type { MemberRole, Profile } from "@/lib/domain";
import type { Repo } from "@/lib/repo/types";
import { DemoRepo, PERSONA_USER, type PersonaKey } from "@/lib/repo/demo";
import { readDelta } from "@/lib/repo/demo/store";

export interface Viewer {
  userId: string;
  profile: Profile;
  repo: Repo;
  /** True inside the furnished example. */
  isTour: boolean;
  persona: PersonaKey | null;
}

/**
 * Who is looking, and through which door. Memoised per request so layouts,
 * pages and actions share one resolution and one repo instance.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const delta = await readDelta();
  if (delta) {
    const repo = new DemoRepo(delta);
    const userId = PERSONA_USER[delta.persona] ?? PERSONA_USER.member;
    const profile = await repo.getProfile(userId);
    if (profile) return { userId, profile, repo, isTour: true, persona: delta.persona };
  }

  if (!env.supabase.isConfigured) return null;

  const { SupabaseRepo, currentUser } = await import("@/lib/repo/supabase");
  const user = await currentUser();
  if (!user) return null;
  const repo = await SupabaseRepo.forUser(user);
  const profile = await repo.getProfile(user.id);
  if (!profile) return null;
  return { userId: user.id, profile, repo, isTour: false, persona: null };
});

export async function requireViewer(opts: { roles?: MemberRole[]; onboarded?: boolean } = {}): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (opts.onboarded !== false && !viewer.profile.onboarded) redirect("/onboarding");
  if (opts.roles && !opts.roles.includes(viewer.profile.role)) redirect("/home");
  return viewer;
}

export function canSeeSociety(profile: Profile): boolean {
  return profile.tier === "society" || profile.role === "mentor" || profile.role === "staff";
}
