import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { emptyDelta, readDelta, writeDelta } from "@/lib/repo/demo/store";
import type { PersonaKey } from "@/lib/repo/demo/world";

const PERSONAS: PersonaKey[] = ["member", "mentor", "house"];

/**
 * Enter the furnished example in a chosen seat. Keeps the visitor's existing
 * changes when they switch seats, so the mentor can see what the member did.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  if (!env.previewEnabled) return NextResponse.redirect(`${origin}/login`);

  const as = url.searchParams.get("as") as PersonaKey | null;
  const persona: PersonaKey = as && PERSONAS.includes(as) ? as : "member";
  const existing = await readDelta();
  const delta = existing ? { ...existing, persona } : emptyDelta(persona);
  await writeDelta(delta);

  const next = url.searchParams.get("next");
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
  return NextResponse.redirect(`${origin}${safe}`);
}
