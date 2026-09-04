import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { clearDelta } from "@/lib/repo/demo/store";

async function signOut(request: Request) {
  if (env.supabase.isConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  await clearDelta();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

export async function POST(request: Request) {
  return signOut(request);
}

/** A plain link works too: the footer and the tour bar use one. */
export async function GET(request: Request) {
  return signOut(request);
}
