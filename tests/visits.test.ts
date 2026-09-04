import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));

import {
  SITTING_KIND_LABEL,
  visitLedger,
  type CircleWithMembers,
  type Profile,
  type Sitting,
} from "@/lib/domain";
import { DemoRepo, IDS } from "@/lib/repo/demo";
import { emptyDelta } from "@/lib/repo/demo/store";

/* ---------- A small circle, built by hand ---------- */

function profile(id: string): Profile {
  return {
    id,
    honorific: "Dr",
    fullName: `Dr ${id.toUpperCase()}`,
    email: null,
    practiceName: `${id} Dental`,
    region: null,
    practiceType: null,
    chairCount: null,
    yearsAsPrincipal: null,
    timezone: "Europe/London",
    bio: null,
    membershipNo: "0000",
    role: "member",
    tier: "society",
    onboarded: true,
    focusAreas: [],
    cadence: "weekly",
    preferredTimes: [],
    mentorCapacity: null,
    mentorNote: null,
    consistencyScore: 0,
    nudgeOptOut: false,
    createdAt: "2026-01-01T09:00:00.000Z",
  };
}

function circleOf(ids: string[]): CircleWithMembers {
  return {
    id: "c-1",
    kind: ids.length > 2 ? "pod" : "pair",
    name: "A circle",
    cadence: "monthly",
    cohortLabel: null,
    status: "active",
    createdAt: "2026-01-01T09:00:00.000Z",
    members: ids.map((id) => ({
      circleId: "c-1",
      userId: id,
      role: "peer" as const,
      joinedAt: "2026-01-01T09:00:00.000Z",
      profile: profile(id),
    })),
  };
}

let n = 0;
function held(hostId: string, at: string): Sitting {
  n += 1;
  return {
    id: `s-${n}`,
    circleId: "c-1",
    scheduledAt: at,
    status: "completed",
    joinUrl: null,
    notes: null,
    createdBy: hostId,
    createdAt: at,
    kind: "visit",
    hostId,
    location: `${hostId} Dental`,
  };
}

function videoSitting(at: string): Sitting {
  n += 1;
  return {
    id: `s-${n}`,
    circleId: "c-1",
    scheduledAt: at,
    status: "completed",
    joinUrl: null,
    notes: null,
    createdBy: "a",
    createdAt: at,
    kind: "video",
    hostId: null,
    location: null,
  };
}

const names = (ps: Profile[]) => ps.map((p) => p.id).sort();

describe("visitLedger", () => {
  it("has everyone outstanding, both ways, when nobody has visited", () => {
    const circle = circleOf(["a", "b", "c"]);
    const ledger = visitLedger(circle, [videoSitting("2026-02-01T09:00:00.000Z")], "a");
    expect(names(ledger.toVisit)).toEqual(["b", "c"]);
    expect(names(ledger.toHost)).toEqual(["b", "c"]);
    expect(ledger.visited).toEqual([]);
    expect(ledger.hosted).toEqual([]);
  });

  it("moves a practice across once its visit is held, and leaves the rest outstanding", () => {
    const circle = circleOf(["a", "b", "c"]);
    const ledger = visitLedger(circle, [held("b", "2026-02-10T08:30:00.000Z")], "a");
    expect(names(ledger.visited.map((v) => v.profile))).toEqual(["b"]);
    expect(ledger.visited[0].at).toBe("2026-02-10T08:30:00.000Z");
    expect(names(ledger.toVisit)).toEqual(["c"]);
    // Nobody has been inside a's practice yet.
    expect(names(ledger.toHost)).toEqual(["b", "c"]);
    expect(ledger.hosted).toEqual([]);
  });

  it("counts a visit the viewer hosted as everyone in the circle having seen theirs", () => {
    const circle = circleOf(["a", "b", "c"]);
    const ledger = visitLedger(circle, [held("a", "2026-03-01T08:30:00.000Z")], "a");
    expect(names(ledger.hosted.map((h) => h.profile))).toEqual(["b", "c"]);
    expect(ledger.hosted.every((h) => h.at === "2026-03-01T08:30:00.000Z")).toBe(true);
    expect(ledger.toHost).toEqual([]);
    // The viewer is never on their own ledger.
    expect(names(ledger.toVisit)).toEqual(["b", "c"]);
  });

  it("settles the account when every practice has been seen both ways", () => {
    const circle = circleOf(["a", "b"]);
    const ledger = visitLedger(
      circle,
      [held("a", "2026-01-20T08:30:00.000Z"), held("b", "2026-02-20T08:30:00.000Z")],
      "a",
    );
    expect(ledger.toVisit).toEqual([]);
    expect(ledger.toHost).toEqual([]);
    expect(names(ledger.visited.map((v) => v.profile))).toEqual(["b"]);
    expect(names(ledger.hosted.map((h) => h.profile))).toEqual(["b"]);
  });

  it("keeps the ledger straight across a pod of six", () => {
    const circle = circleOf(["a", "b", "c", "d", "e", "f"]);
    const sittings = [held("b", "2026-01-05T09:00:00.000Z"), held("c", "2026-02-05T09:00:00.000Z")];
    const ledger = visitLedger(circle, sittings, "a");
    expect(names(ledger.visited.map((v) => v.profile))).toEqual(["b", "c"]);
    expect(names(ledger.toVisit)).toEqual(["d", "e", "f"]);
    expect(ledger.toHost).toHaveLength(5);
    // From b's chair: b has hosted everyone, and has been inside c's.
    const fromB = visitLedger(circle, sittings, "b");
    expect(fromB.toHost).toEqual([]);
    expect(names(fromB.visited.map((v) => v.profile))).toEqual(["c"]);
    expect(names(fromB.toVisit)).toEqual(["a", "d", "e", "f"]);
  });

  it("takes the most recent morning when a practice has been visited twice", () => {
    const circle = circleOf(["a", "b"]);
    const ledger = visitLedger(
      circle,
      [held("b", "2026-01-05T09:00:00.000Z"), held("b", "2026-04-05T09:00:00.000Z")],
      "a",
    );
    expect(ledger.visited).toHaveLength(1);
    expect(ledger.visited[0].at).toBe("2026-04-05T09:00:00.000Z");
  });

  it("ignores visits belonging to another circle, and ones not yet held", () => {
    const circle = circleOf(["a", "b"]);
    const elsewhere: Sitting = { ...held("b", "2026-01-05T09:00:00.000Z"), circleId: "c-other" };
    const notYet: Sitting = { ...held("b", "2026-09-05T09:00:00.000Z"), status: "scheduled" };
    const ledger = visitLedger(circle, [elsewhere, notYet], "a");
    expect(names(ledger.toVisit)).toEqual(["b"]);
    expect(ledger.visited).toEqual([]);
  });
});

describe("the furnished example's visits", () => {
  it("labels the two kinds", () => {
    expect(SITTING_KIND_LABEL.video).toBe("Sitting");
    expect(SITTING_KIND_LABEL.visit).toBe("Practice visit");
  });

  it("carries a kind, a host and a place on every sitting", async () => {
    const repo = new DemoRepo(emptyDelta("member"));
    const circles = await repo.listAllCircles();
    const sittings = await repo.listSittings(circles.map((c) => c.id));
    expect(sittings.length).toBeGreaterThan(0);
    for (const s of sittings) {
      expect(["video", "visit"]).toContain(s.kind);
      if (s.kind === "visit") {
        expect(s.hostId).toBeTruthy();
        expect(s.location).toBeTruthy();
      } else {
        expect(s.hostId).toBeNull();
        expect(s.location).toBeNull();
      }
    }
  });

  it("shows Cheng inside Adesanya's practice, with Adesanya due in Marylebone", async () => {
    const repo = new DemoRepo(emptyDelta("member"));
    const circles = await repo.listCirclesFor(IDS.cheng);
    const pair = circles.find((c) => c.kind === "pair")!;
    const sittings = await repo.listSittings([pair.id]);
    const ledger = visitLedger(pair, sittings, IDS.cheng);

    expect(ledger.visited.map((v) => v.profile.id)).toEqual([IDS.adesanya]);
    expect(ledger.toVisit).toEqual([]);
    // Adesanya has not yet been inside Cheng's: that visit is still in the diary.
    expect(ledger.toHost.map((p) => p.id)).toEqual([IDS.adesanya]);
    const booked = sittings.find((s) => s.kind === "visit" && s.status === "scheduled");
    expect(booked?.hostId).toBe(IDS.cheng);
    expect(booked?.location).toBe("Cheng Dental, Marylebone");
    expect(new Date(booked!.scheduledAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("records the pod's morning at Shah & Associates", async () => {
    const repo = new DemoRepo(emptyDelta("member"));
    const circles = await repo.listCirclesFor(IDS.cheng);
    const pod = circles.find((c) => c.kind === "pod")!;
    const sittings = await repo.listSittings([pod.id]);
    const ledger = visitLedger(pod, sittings, IDS.cheng);
    expect(ledger.visited.map((v) => v.profile.id)).toEqual([IDS.shah]);
    expect(ledger.toVisit).toHaveLength(pod.members.length - 2);
    expect(ledger.toHost).toHaveLength(pod.members.length - 1);
    // From Shah's chair, everyone has been inside hers.
    expect(visitLedger(pod, sittings, IDS.shah).toHost).toEqual([]);
  });

  it("defaults a newly arranged sitting to video and carries a visit through", async () => {
    const repo = new DemoRepo(emptyDelta("member"));
    const plain = await repo.createSitting({
      circleId: IDS.pod,
      scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
      createdBy: IDS.cheng,
    });
    expect(plain.kind).toBe("video");
    expect(plain.hostId).toBeNull();
    expect(plain.location).toBeNull();

    const visit = await repo.createSitting({
      circleId: IDS.pod,
      scheduledAt: new Date(Date.now() + 172_800_000).toISOString(),
      createdBy: IDS.cheng,
      kind: "visit",
      hostId: IDS.field,
      location: "Field Dental, Clifton",
    });
    expect(visit.kind).toBe("visit");
    expect(visit.hostId).toBe(IDS.field);
    expect(visit.location).toBe("Field Dental, Clifton");
  });
});
