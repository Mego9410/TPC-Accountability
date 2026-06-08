import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeMicrosoftCode } from "@/lib/integrations/calendar";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (!code) return NextResponse.redirect(`${origin}/calendar?notice=microsoft-failed`);

  try {
    const tokens = await exchangeMicrosoftCode(code);
    await supabase.from("calendar_connections").upsert(
      {
        user_id: user.id,
        provider: "microsoft",
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt,
        account_email: tokens.accountEmail,
        calendar_id: "primary",
      },
      { onConflict: "user_id,provider" },
    );
    return NextResponse.redirect(`${origin}/calendar?notice=microsoft-connected`);
  } catch {
    return NextResponse.redirect(`${origin}/calendar?notice=microsoft-failed`);
  }
}
