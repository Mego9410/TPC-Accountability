import { NextResponse } from "next/server";
import { clearDelta } from "@/lib/repo/demo/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  await clearDelta();
  return NextResponse.redirect(`${origin}/`);
}
