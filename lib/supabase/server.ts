import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/lib/repo/supabase/database.types";

/**
 * Server-side Supabase client bound to the request cookie store, typed against
 * the schema in supabase/migrations. Use inside Server Components, Route
 * Handlers, and Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` can be called from a Server Component, where mutating
          // cookies is not permitted. Middleware refreshes the session, so
          // this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client for privileged server work. It bypasses row level
 * security; never import this from client components.
 */
export function createServiceClient() {
  return createServerClient<Database>(env.supabase.url, env.supabase.serviceRoleKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

export type ServerClient = Awaited<ReturnType<typeof createClient>>;
