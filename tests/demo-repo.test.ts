import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));

import { DemoRepo, IDS } from "@/lib/repo/demo";
import { emptyDelta } from "@/lib/repo/demo/store";
import { menteesOf, mentorOf } from "@/lib/domain";

function repo() {
  return new DemoRepo(emptyDelta("member"));
}

describe("the furnished example", () => {
  it("seats Cheng as Adesanya's mentee and both in the pod", async () => {
    const r = repo();
    const circles = await r.listCirclesFor(IDS.cheng);
    expect(circles.map((c) => c.kind).sort()).toEqual(["pair", "pod"]);
    expect(mentorOf(circles, IDS.cheng)?.id).toBe(IDS.adesanya);
    const mentorCircles = await r.listCirclesFor(IDS.adesanya);
    expect(menteesOf(mentorCircles, IDS.adesanya).map((p) => p.id)).toContain(IDS.delaney);
  });

  it("layers the visitor's changes over the base world", async () => {
    const r = repo();
    const before = await r.listCommitments(IDS.blockCheng);
    const open = before.find((c) => c.status === "open")!;
    await r.updateCommitment(open.id, { status: "done" });
    const win = await r.createWin({ userId: IDS.cheng, blockId: IDS.blockCheng, title: "Kept it", detail: null });
    const after = await r.listCommitments(IDS.blockCheng);
    expect(after.find((c) => c.id === open.id)?.status).toBe("done");
    expect((await r.listWins(IDS.cheng)).some((w) => w.id === win.id)).toBe(true);
    // a fresh repo over an empty delta does not see it
    expect((await repo().listWins(IDS.cheng)).some((w) => w.id === win.id)).toBe(false);
  });

  it("upserts benchmark figures by month and metric", async () => {
    const r = repo();
    const period = (await r.listBenchmarkEntries(IDS.cheng)).at(-1)!.period;
    await r.upsertBenchmarkEntry({ userId: IDS.cheng, period, metricKey: "monthly_turnover", value: 999 });
    const entries = (await r.listBenchmarkEntries(IDS.cheng)).filter((e) => e.metricKey === "monthly_turnover" && e.period === period);
    expect(entries).toHaveLength(1);
    expect(entries[0].value).toBe(999);
  });

  it("counts unread correspondence and clears it", async () => {
    const r = repo();
    const circles = await r.listCirclesFor(IDS.cheng);
    const ids = circles.map((c) => c.id);
    expect(await r.countUnread(ids, IDS.cheng)).toBeGreaterThan(0);
    for (const id of ids) await r.markRead(id, IDS.cheng);
    expect(await r.countUnread(ids, IDS.cheng)).toBe(0);
  });

  it("vacates and fills seats", async () => {
    const r = repo();
    await r.setCircleMember(IDS.pod, IDS.hart, null);
    expect((await r.getCircle(IDS.pod))!.members.some((m) => m.userId === IDS.hart)).toBe(false);
    await r.setCircleMember(IDS.pod, IDS.hart, "peer");
    expect((await r.getCircle(IDS.pod))!.members.some((m) => m.userId === IDS.hart)).toBe(true);
  });
});
