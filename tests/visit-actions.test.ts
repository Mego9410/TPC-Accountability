import { describe, expect, it, vi } from "vitest";

/** A visitor to the furnished example, seated as Dr Cheng. */
vi.mock("next/headers", async () => {
  const { deflateRawSync } = await import("node:zlib");
  const value = deflateRawSync(
    Buffer.from(JSON.stringify({ v: 1, persona: "member", a: {}, m: {}, r: {} }), "utf8"),
  ).toString("base64url");
  const jar = new Map<string, string>([["tpc_tour", value]]);
  return {
    cookies: async () => ({
      get: (k: string) => (jar.has(k) ? { name: k, value: jar.get(k) } : undefined),
      set: (k: string, v: string) => { jar.set(k, v); },
      delete: (k: string) => { jar.delete(k); },
    }),
  };
});
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`REDIRECT:${to}`); } }));

import { EMPTY_STATE } from "@/lib/actions/state";
import { scheduleSitting } from "@/lib/actions/sittings";
import { IDS } from "@/lib/repo/demo";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

/** The action redirects on success; the mock turns that into a throw. */
async function run(fields: Record<string, string>) {
  try {
    return { state: await scheduleSitting(EMPTY_STATE, form(fields)), redirect: null as string | null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("REDIRECT:")) return { state: null, redirect: message.slice("REDIRECT:".length) };
    throw err;
  }
}

const soon = () => new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 16);

describe("scheduleSitting", () => {
  it("arranges a sitting over video by default", async () => {
    const { redirect } = await run({ circle_id: IDS.pairCheng, scheduled_at: soon(), kind: "video" });
    expect(redirect).toMatch(/^\/sittings\//);
  });

  it("asks whose practice is being visited", async () => {
    const { state } = await run({ circle_id: IDS.pairCheng, scheduled_at: soon(), kind: "visit" });
    expect(state?.ok).toBe(false);
    expect(state?.errors.host_id).toBe("Choose whose practice is being visited.");
  });

  it("refuses a host who does not sit in that circle", async () => {
    const { state } = await run({
      circle_id: IDS.pairCheng,
      scheduled_at: soon(),
      kind: "visit",
      host_id: IDS.shah,
    });
    expect(state?.ok).toBe(false);
    expect(state?.message).toBe("That principal does not sit in this circle.");
  });

  it("takes the place from the host's particulars", async () => {
    const { redirect } = await run({
      circle_id: IDS.pod,
      scheduled_at: soon(),
      kind: "visit",
      host_id: IDS.shah,
    });
    expect(redirect).toMatch(/^\/sittings\//);
  });
});
