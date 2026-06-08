import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { googleAuthUrl } from "@/lib/integrations/calendar";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!env.google.isConfigured) {
    return NextResponse.redirect(`${origin}/calendar?notice=google-unconfigured`);
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  return NextResponse.redirect(googleAuthUrl(user.id));
}
