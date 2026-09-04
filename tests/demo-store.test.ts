import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));

import { decodeDelta, emptyDelta, encodeDelta } from "@/lib/repo/demo/store";

describe("tour cookie", () => {
  it("round-trips a delta", () => {
    const delta = emptyDelta("mentor");
    delta.a.wins = [{ id: "w-x", userId: "u-cheng", title: "A win", detail: null, blockId: null, archivedAt: null, createdAt: "2026-09-02T09:00:00.000Z" }];
    delta.m.commitments = { "cm-7": { status: "done" } };
    delta.r["c-pair-cheng:u-cheng"] = "2026-09-02T09:00:00.000Z";
    const chunks = encodeDelta(delta);
    expect(chunks.length).toBe(1);
    expect(decodeDelta(chunks)).toEqual(delta);
  });
  it("rejects garbage", () => {
    expect(decodeDelta(["not-base64!!"])).toBeNull();
    expect(decodeDelta([])).toBeNull();
  });
  it("keeps a busy session inside a few cookies", () => {
    const delta = emptyDelta("member");
    delta.a.checkIns = Array.from({ length: 30 }, (_, i) => ({
      id: `ci-${i}`, userId: "u-cheng", circleId: "c-pod", weekKey: `2026-W${i}`, blockWeek: 1,
      didWell: "Something went well this week and I wrote about it at some length.",
      struggledWith: "Something else was harder than expected.",
      nextFocus: "The next thing.", energy: 7, completedAt: "2026-09-02T09:00:00.000Z",
    }));
    expect(encodeDelta(delta).length).toBeLessThanOrEqual(2);
  });
});
