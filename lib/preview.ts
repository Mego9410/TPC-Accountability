import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const PREVIEW_COOKIE = "tpc_preview";

/**
 * Preview (demo) mode is available only when Supabase is not configured — once
 * real records are connected, authentication takes over and the bypass is gone.
 */
export async function isPreviewMode(): Promise<boolean> {
  if (env.supabase.isConfigured) return false;
  const store = await cookies();
  return store.get(PREVIEW_COOKIE)?.value === "1";
}
