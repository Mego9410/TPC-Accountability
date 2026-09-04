import "server-only";
import { cookies } from "next/headers";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { PersonaKey } from "./world";

/**
 * The visitor's own changes to the furnished example, kept in their browser as
 * a compressed, chunked cookie. The base world never changes; this is the
 * delta on top of it. Nothing is stored on a server.
 */
export type Patch = Record<string, unknown>;
export interface DemoDelta {
  v: 1;
  persona: PersonaKey;
  /** Added rows, by collection. */
  a: Record<string, Patch[]>;
  /** Patched rows, by collection then id. */
  m: Record<string, Record<string, Patch>>;
  /** Read markers, circleId -> iso. */
  r: Record<string, string>;
}

export const DEMO_COOKIE = "tpc_tour";
const CHUNK = 3600;
const MAX_CHUNKS = 3;
const MAX_AGE = 60 * 60 * 24 * 7;

export function emptyDelta(persona: PersonaKey): DemoDelta {
  return { v: 1, persona, a: {}, m: {}, r: {} };
}

export function encodeDelta(delta: DemoDelta): string[] {
  const json = JSON.stringify(delta);
  const packed = deflateRawSync(Buffer.from(json, "utf8")).toString("base64url");
  const chunks: string[] = [];
  for (let i = 0; i < packed.length; i += CHUNK) chunks.push(packed.slice(i, i + CHUNK));
  return chunks;
}

export function decodeDelta(chunks: string[]): DemoDelta | null {
  if (chunks.length === 0) return null;
  try {
    const json = inflateRawSync(Buffer.from(chunks.join(""), "base64url")).toString("utf8");
    const parsed = JSON.parse(json) as DemoDelta;
    if (parsed?.v !== 1 || !parsed.persona) return null;
    return { v: 1, persona: parsed.persona, a: parsed.a ?? {}, m: parsed.m ?? {}, r: parsed.r ?? {} };
  } catch {
    return null;
  }
}

export async function readDelta(): Promise<DemoDelta | null> {
  const store = await cookies();
  const first = store.get(DEMO_COOKIE)?.value;
  if (!first) return null;
  const chunks = [first];
  for (let i = 1; i < MAX_CHUNKS; i += 1) {
    const c = store.get(`${DEMO_COOKIE}_${i}`)?.value;
    if (!c) break;
    chunks.push(c);
  }
  return decodeDelta(chunks);
}

/** Writes the delta. Only callable from a Server Action or Route Handler. */
export async function writeDelta(delta: DemoDelta): Promise<void> {
  const store = await cookies();
  let chunks = encodeDelta(delta);
  if (chunks.length > MAX_CHUNKS) {
    // The visitor has done a great deal. Drop the oldest additions until it fits.
    for (const key of Object.keys(delta.a)) {
      while (delta.a[key].length > 0 && encodeDelta(delta).length > MAX_CHUNKS) delta.a[key].shift();
    }
    chunks = encodeDelta(delta);
  }
  const opts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: MAX_AGE };
  chunks.forEach((value, i) => store.set(i === 0 ? DEMO_COOKIE : `${DEMO_COOKIE}_${i}`, value, opts));
  for (let i = chunks.length; i < MAX_CHUNKS; i += 1) {
    if (store.get(i === 0 ? DEMO_COOKIE : `${DEMO_COOKIE}_${i}`)) store.delete(i === 0 ? DEMO_COOKIE : `${DEMO_COOKIE}_${i}`);
  }
}

export async function clearDelta(): Promise<void> {
  const store = await cookies();
  for (let i = 0; i < MAX_CHUNKS; i += 1) store.delete(i === 0 ? DEMO_COOKIE : `${DEMO_COOKIE}_${i}`);
}
