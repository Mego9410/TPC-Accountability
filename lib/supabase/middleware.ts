import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * The cookie that marks a visitor as touring the furnished example. Mirrors
 * DEMO_COOKIE in lib/repo/demo/store.ts, which cannot be imported here: that
 * module is server-only and pulls in node:zlib, neither of which the edge
 * runtime allows.
 */
const TOUR_COOKIE = "tpc_tour";

/** Routes reachable without an authenticated session. */
const PUBLIC_PATHS = [
  "/",
  "/for-mentors",
  "/for-mentees",
  "/membership",
  "/visits",
  "/house-rules",
  "/privacy",
  "/tour",
  "/login",
  "/signup",
  "/auth",
  "/api/tour",
  "/api/auth",
];

/** Old addresses that still turn up in bookmarks and emails. */
const LEGACY_REDIRECTS: Record<string, string> = {
  "/dashboard": "/home",
  "/goals": "/blocks",
  "/accountability": "/home",
  "/accountability/blocks": "/blocks",
  "/accountability/check-in": "/check-in",
  "/accountability/pod": "/circle",
  "/accountability/wins": "/wins",
  "/accountability/review": "/review",
  "/accountability/benchmark": "/benchmark",
  "/accountability/challenges": "/challenges",
  "/accountability/templates": "/blocks/new",
  "/accountability/profile": "/settings",
  "/accountability/admin/pods": "/house",
};

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)));
}

function legacyTarget(pathname: string): string | null {
  const exact = LEGACY_REDIRECTS[pathname];
  if (exact) return exact;
  if (pathname.startsWith("/accountability/blocks/")) return `/blocks${pathname.slice("/accountability/blocks".length)}`;
  if (pathname.startsWith("/accountability/")) return "/home";
  return null;
}

/**
 * A `next` destination is honoured only when it is a same-origin path: it
 * must begin with a single "/" (so "//evil.example" and "https://…" are out)
 * and contain no control characters.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  // eslint-disable-next-line no-control-regex -- control characters are exactly what we reject
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Old addresses first, before anything else has a say.
  const legacy = legacyTarget(pathname);
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = legacy;
    return NextResponse.redirect(url, 308);
  }

  // A `next` we would not honour is dropped rather than carried around.
  const rawNext = request.nextUrl.searchParams.get("next");
  if (rawNext !== null && safeNext(rawNext) === null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  // The tour is self-contained: the furnished example lives in the visitor's
  // cookie and never touches Supabase, so there is no session to check.
  if (request.cookies.get(TOUR_COOKIE)?.value) {
    return response;
  }

  // Without Supabase configured we cannot gate routes; let everything through
  // so the design remains demoable. The UI shows a setup notice.
  if (!env.supabase.isConfigured) {
    return response;
  }

  const supabase = createServerClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() (not getSession()) so the token is verified with the server
  // and refreshed if it has gone stale.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const next = safeNext(`${pathname}${search}`);
    if (next && next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  return response;
}
