import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));

import { decodeDelta, emptyDelta, encodeDelta } from "@/lib/repo/demo/store";

describe("tour cookie", () => {
  it("round-trips a delta", () => {
    const delta = emptyDelta("partner");
    delta.a.goals = [
      {
        id: "g-x",
        userId: "u-cheng",
        title: "Recruit an associate for two days a week",
        detail: null,
        targetDate: "2026-11-30",
        status: "open",
        doneAt: null,
        createdAt: "2026-09-02T09:00:00.000Z",
      },
    ];
    delta.m.visits = { "v-field-asks": { status: "agreed" } };
    delta.r["u-adesanya"] = "2026-09-02T09:00:00.000Z";
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
    delta.a.goalUpdates = Array.from({ length: 30 }, (_, i) => ({
      id: `gu-${i}`,
      goalId: "g-cheng-acceptance",
      authorId: "u-adesanya",
      body: "You said 65 by December and you are three points off in September. Raise it to 70 or you will coast.",
      createdAt: "2026-09-02T09:00:00.000Z",
    }));
    expect(encodeDelta(delta).length).toBeLessThanOrEqual(2);
  });
});
