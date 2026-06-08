import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { PREVIEW_COOKIE } from "@/lib/preview";

/**
 * Enter preview (demo) mode. Available only while Supabase is unconfigured —
 * once real records are connected, this redirects to the proper sign-in.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  if (env.supabase.isConfigured) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const response = NextResponse.redirect(`${origin}/dashboard`);
  response.cookies.set(PREVIEW_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
