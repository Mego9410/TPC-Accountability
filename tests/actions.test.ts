import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

const seat = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/lib/session", () => ({ getViewer: async () => seat.current }));

import { DemoRepo, IDS } from "@/lib/repo/demo";
import { emptyDelta } from "@/lib/repo/demo/store";
import { EMPTY_STATE, type ActionState } from "@/lib/actions/state";
import { formToObject } from "@/lib/actions/define";
import { addGoal, addGoalUpdate, setGoalStatus } from "@/lib/actions/goals";
import { answerPartnerRequest, endPartnership } from "@/lib/actions/partners";
import { answerVisit, markVisitHeld, updateVisitDetails } from "@/lib/actions/visits";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

let repo: DemoRepo;

async function sitAs(userId: string) {
  const profile = await repo.getProfile(userId);
  if (!profile) throw new Error(`No such member: ${userId}`);
  seat.current = { userId, profile, repo, isTour: true, persona: "member" };
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const run = (action: Action, fields: Record<string, string>) => action(EMPTY_STATE, form(fields));

beforeEach(async () => {
  repo = new DemoRepo(emptyDelta("member"));
  await sitAs(IDS.cheng);
});

describe("formToObject", () => {
  it("collects repeated keys into arrays", () => {
    const fd = new FormData();
    fd.append("title", "A");
    fd.append("focus[]", "One");
    fd.append("focus[]", "Two");
    expect(formToObject(fd)).toEqual({ title: "A", focus: ["One", "Two"] });
  });
});

describe("goals", () => {
  it("sets a goal down and closes it again", async () => {
    const added = await run(addGoal, { title: "Close on Fridays", target_date: "2027-01-29" });
    expect(added.ok).toBe(true);

    const goals = await repo.listGoals([IDS.cheng]);
    const mine = goals.find((g) => g.title === "Close on Fridays");
    expect(mine?.targetDate).toBe("2027-01-29");
    if (!mine) throw new Error("the goal was not set down");

    const closed = await run(setGoalStatus, { goal_id: mine.id, status: "done" });
    expect(closed.ok).toBe(true);
    expect((await repo.getGoal(mine.id))?.status).toBe("done");
  });

  it("refuses a goal without a title", async () => {
    const out = await run(addGoal, { title: "  " });
    expect(out.ok).toBe(false);
    expect(out.errors.title).toBeTruthy();
  });

  it("lets a partner write against your goal, and a stranger not", async () => {
    await sitAs(IDS.adesanya);
    const written = await run(addGoalUpdate, { goal_id: "g-cheng-acceptance", body: "Raise it to 70." });
    expect(written.ok).toBe(true);

    await sitAs(IDS.okafor);
    const refused = await run(addGoalUpdate, { goal_id: "g-cheng-acceptance", body: "A word from nowhere." });
    expect(refused.ok).toBe(false);
  });
});

describe("the partner", () => {
  it("takes one at a time: the running partnership ends before the next begins", async () => {
    const blocked = await run(answerPartnerRequest, { partnership_id: "p-delaney-cheng", answer: "accept" });
    expect(blocked.ok).toBe(false);
    expect(blocked.message).toContain("End your current partnership");

    const ended = await run(endPartnership, { partnership_id: "p-cheng-adesanya" });
    expect(ended.ok).toBe(true);

    // Accepting redirects to /partner, which the mocked router throws for.
    await expect(
      run(answerPartnerRequest, { partnership_id: "p-delaney-cheng", answer: "accept" }),
    ).rejects.toThrow("REDIRECT:/partner");
    expect((await repo.getPartnership("p-delaney-cheng"))?.status).toBe("active");
  });

  it("will not let the one who asked answer their own request", async () => {
    await sitAs(IDS.delaney);
    const notYours = await run(answerPartnerRequest, { partnership_id: "p-delaney-cheng", answer: "accept" });
    expect(notYours.ok).toBe(false);
    expect(notYours.message).toContain("it is for them to answer");
  });
});

describe("a companion visit", () => {
  it("is agreed by the other party, not the one who proposed it", async () => {
    const proposer = await run(answerVisit, { visit_id: "v-field-asks", answer: "agree" });
    expect(proposer.ok).toBe(true);
    expect((await repo.getVisit("v-field-asks"))?.status).toBe("agreed");
  });

  it("lets the host write the arrival note on an agreed morning, and the visitor not", async () => {
    const set = await run(updateVisitDetails, {
      visit_id: "v-cheng",
      arrival_note: "Ring the bell; Deborah will let you in.",
    });
    expect(set.ok).toBe(true);
    expect((await repo.getVisit("v-cheng"))?.arrivalNote).toContain("Deborah");

    await sitAs(IDS.adesanya);
    const refused = await run(updateVisitDetails, { visit_id: "v-cheng", arrival_note: "Park anywhere." });
    expect(refused.ok).toBe(false);
  });

  it("lets either party move an agreed morning without touching the notes", async () => {
    const when = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const moved = await run(updateVisitDetails, { visit_id: "v-cheng", scheduled_at: when });
    expect(moved.ok).toBe(true);
    const after = await repo.getVisit("v-cheng");
    expect(after?.scheduledAt).toBe(new Date(when).toISOString());
    expect(after?.notes).toBeNull();
  });

  it("opens the notes to both of them once the morning is held", async () => {
    const early = await run(updateVisitDetails, { visit_id: "v-cheng", notes: "Too soon." });
    expect(early.ok).toBe(false);

    // Adesanya was the visitor at the morning already held in Leeds.
    await sitAs(IDS.cheng);
    const written = await run(updateVisitDetails, { visit_id: "v-adesanya", notes: "Nine-minute huddle." });
    expect(written.ok).toBe(true);
    expect((await repo.getVisit("v-adesanya"))?.notes).toBe("Nine-minute huddle.");

    await sitAs(IDS.adesanya);
    const theirs = await run(updateVisitDetails, { visit_id: "v-adesanya", notes: "And a good question back." });
    expect(theirs.ok).toBe(true);
    expect((await repo.getVisit("v-adesanya"))?.notes).toBe("And a good question back.");
  });

  it("records a morning as held only once it has happened", async () => {
    const tooSoon = await run(markVisitHeld, { visit_id: "v-cheng" });
    expect(tooSoon.ok).toBe(false);
  });
});
