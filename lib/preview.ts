import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const PREVIEW_COOKIE = "tpc_preview";

/**
 * Whether the demo "bypass" tour is offered at all. Available when Supabase is
 * unconfigured, OR when explicitly enabled via NEXT_PUBLIC_ENABLE_PREVIEW so the
 * furnished example can be toured even once real records are connected.
 */
export function isPreviewAvailable(): boolean {
  return env.previewEnabled || !env.supabase.isConfigured;
}

/** True when the visitor has chosen to tour the furnished example. */
export async function isPreviewMode(): Promise<boolean> {
  if (!isPreviewAvailable()) return false;
  const store = await cookies();
  return store.get(PREVIEW_COOKIE)?.value === "1";
}
