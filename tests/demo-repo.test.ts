import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));

import { DemoRepo, IDS } from "@/lib/repo/demo";
import { emptyDelta } from "@/lib/repo/demo/store";
import { awaitingAnswerFrom, partnerIdOf } from "@/lib/domain";

function repo() {
  return new DemoRepo(emptyDelta("member"));
}

describe("the furnished example", () => {
  it("seats Cheng with Adesanya, and leaves Delaney waiting on an answer", async () => {
    const r = repo();
    const held = await r.listPartnerships(IDS.cheng);
    const active = held.find((p) => p.status === "active");
    expect(active).toBeDefined();
    expect(active && partnerIdOf(active, IDS.cheng)).toBe(IDS.adesanya);
    expect(held.filter((p) => awaitingAnswerFrom(p, IDS.cheng)).map((p) => p.id)).toEqual(["p-delaney-cheng"]);
  });

  it("does not put the House in the members directory", async () => {
    const members = await repo().listMembers();
    expect(members.some((m) => m.id === IDS.house)).toBe(false);
    expect(members.some((m) => m.id === IDS.cheng)).toBe(true);
  });

  it("layers the visitor's changes over the base world", async () => {
    const r = repo();

    // Answer the partner request that is waiting.
    await r.updatePartnership("p-delaney-cheng", { status: "active", startedAt: new Date().toISOString() });
    const answered = (await r.listPartnerships(IDS.cheng)).find((p) => p.id === "p-delaney-cheng");
    expect(answered?.status).toBe("active");

    // Set a goal down, and write a word against it.
    const goal = await r.createGoal({ userId: IDS.cheng, title: "Close the practice on Fridays", targetDate: "2027-01-29" });
    expect((await r.listGoals([IDS.cheng])).some((g) => g.id === goal.id)).toBe(true);

    const word = await r.createGoalUpdate({ goalId: goal.id, authorId: IDS.adesanya, body: "You have said this before." });
    const updates = await r.listGoalUpdates([goal.id]);
    expect(updates.map((u) => u.id)).toContain(word.id);
    expect(updates.at(-1)?.authorId).toBe(IDS.adesanya);

    // Answer the morning Field has proposed.
    await r.updateVisit("v-field-asks", { status: "agreed" });
    expect((await r.getVisit("v-field-asks"))?.status).toBe("agreed");

    // A fresh repo over an empty delta sees none of it.
    const clean = repo();
    expect((await clean.listPartnerships(IDS.cheng)).find((p) => p.id === "p-delaney-cheng")?.status).toBe("proposed");
    expect((await clean.listGoals([IDS.cheng])).some((g) => g.id === goal.id)).toBe(false);
    expect((await clean.listGoalUpdates([goal.id])).length).toBe(0);
    expect((await clean.getVisit("v-field-asks"))?.status).toBe("proposed");
  });

  it("keeps a goal's words in the order they were written", async () => {
    const updates = await repo().listGoalUpdates(["g-cheng-acceptance"]);
    expect(updates.map((u) => u.id)).toEqual(["gu-1", "gu-2", "gu-3"]);
  });

  it("counts unread correspondence and clears it", async () => {
    const r = repo();
    expect(await r.countUnread(IDS.cheng)).toBeGreaterThan(0);
    await r.markRead(IDS.cheng, IDS.adesanya);
    await r.markRead(IDS.cheng, IDS.delaney);
    expect(await r.countUnread(IDS.cheng)).toBe(0);
    // and the base world is untouched for the next visitor
    expect(await repo().countUnread(IDS.cheng)).toBeGreaterThan(0);
  });

  it("keeps a thread to the two people in it", async () => {
    const r = repo();
    const sent = await r.createMessage({ fromId: IDS.cheng, toId: IDS.field, body: "Thursday would suit." });
    const thread = await r.listMessagesWith(IDS.cheng, IDS.field);
    expect(thread.map((m) => m.id)).toEqual([sent.id]);
    expect((await r.listMessagesWith(IDS.adesanya, IDS.field)).length).toBe(0);
  });
});
