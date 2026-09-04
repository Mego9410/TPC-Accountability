import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { clearDelta } from "@/lib/repo/demo/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = env.siteUrl.startsWith("http") && process.env.NODE_ENV === "production" ? env.siteUrl : url.origin;
  await clearDelta();
  return NextResponse.redirect(`${origin}/`);
}
