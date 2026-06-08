import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { PREVIEW_COOKIE } from "@/lib/preview";

export async function POST(request: Request) {
  if (env.supabase.isConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.delete(PREVIEW_COOKIE);
  return response;
}

// Allow exiting preview via a simple link as well.
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(PREVIEW_COOKIE);
  return response;
}
