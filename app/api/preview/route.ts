import { NextResponse } from "next/server";
import { PREVIEW_COOKIE, isPreviewAvailable } from "@/lib/preview";

/**
 * Enter preview (demo) mode. Available while Supabase is unconfigured or when
 * NEXT_PUBLIC_ENABLE_PREVIEW is set; otherwise redirects to the proper sign-in.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  if (!isPreviewAvailable()) {
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
