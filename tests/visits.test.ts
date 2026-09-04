import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));

import {
  VISIT_NOTE_HELP,
  VISIT_NOTE_LABEL,
  VISIT_STATUS_LABEL,
  awaitingResponseFrom,
  noteKindsFor,
  undertakingGiven,
  visitLedger,
  type CircleWithMembers,
  type Profile,
  type Visit,
  type VisitStatus,
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
/** A morning that happened: `visitorId` went to `hostId`. */
function held(visitorId: string, hostId: string, at: string, patch: Partial<Visit> = {}): Visit {
  n += 1;
  return {
    id: `v-${n}`,
    circleId: "c-1",
    visitorId,
    hostId,
    proposedById: hostId,
    scheduledAt: at,
    status: "held",
    practiceName: `${hostId} Dental`,
    proposalNote: null,
    arrivalNote: null,
    visitorAgreedAt: at,
    hostAgreedAt: at,
    heldAt: at,
    createdAt: at,
    ...patch,
  };
}

const names = (ps: Profile[]) => ps.map((p) => p.id).sort();

describe("visitLedger", () => {
  it("has everyone outstanding, both ways, when nobody has visited", () => {
    const circle = circleOf(["a", "b", "c"]);
    const ledger = visitLedger(circle, [], "a");
    expect(names(ledger.toVisit)).toEqual(["b", "c"]);
    expect(names(ledger.toHost)).toEqual(["b", "c"]);
    expect(ledger.visited).toEqual([]);
    expect(ledger.hosted).toEqual([]);
  });

  it("moves a practice across once its morning is held, and leaves the rest outstanding", () => {
    const circle = circleOf(["a", "b", "c"]);
    const ledger = visitLedger(circle, [held("a", "b", "2026-02-10T08:30:00.000Z")], "a");
    expect(names(ledger.visited.map((v) => v.profile))).toEqual(["b"]);
    expect(ledger.visited[0].at).toBe("2026-02-10T08:30:00.000Z");
    expect(names(ledger.toVisit)).toEqual(["c"]);
    // Nobody has been inside a's practice yet.
    expect(names(ledger.toHost)).toEqual(["b", "c"]);
    expect(ledger.hosted).toEqual([]);
  });

  it("counts a morning the viewer hosted as that principal having seen theirs", () => {
    const circle = circleOf(["a", "b", "c"]);
    const ledger = visitLedger(circle, [held("b", "a", "2026-03-01T08:30:00.000Z")], "a");
    expect(names(ledger.hosted.map((h) => h.profile))).toEqual(["b"]);
    expect(ledger.hosted[0].at).toBe("2026-03-01T08:30:00.000Z");
    // c has still not been inside a's, and a has been inside nobody's.
    expect(names(ledger.toHost)).toEqual(["c"]);
    expect(names(ledger.toVisit)).toEqual(["b", "c"]);
  });

  it("settles the account when a pair has been inside each other's, both ways", () => {
    const circle = circleOf(["a", "b"]);
    const ledger = visitLedger(
      circle,
      [held("b", "a", "2026-01-20T08:30:00.000Z"), held("a", "b", "2026-02-20T08:30:00.000Z")],
      "a",
    );
    expect(ledger.toVisit).toEqual([]);
    expect(ledger.toHost).toEqual([]);
    expect(names(ledger.visited.map((v) => v.profile))).toEqual(["b"]);
    expect(names(ledger.hosted.map((h) => h.profile))).toEqual(["b"]);
    // The viewer is never on their own ledger.
    expect(ledger.visited.map((v) => v.profile.id)).not.toContain("a");
  });

  it("keeps the ledger straight across a pod of six", () => {
    const circle = circleOf(["a", "b", "c", "d", "e", "f"]);
    const visits = [
      held("a", "b", "2026-01-05T09:00:00.000Z"),
      held("a", "c", "2026-02-05T09:00:00.000Z"),
      held("b", "a", "2026-02-12T09:00:00.000Z"),
    ];
    const ledger = visitLedger(circle, visits, "a");
    expect(names(ledger.visited.map((v) => v.profile))).toEqual(["b", "c"]);
    expect(names(ledger.toVisit)).toEqual(["d", "e", "f"]);
    expect(names(ledger.hosted.map((h) => h.profile))).toEqual(["b"]);
    expect(names(ledger.toHost)).toEqual(["c", "d", "e", "f"]);

    // From b's chair: b has been inside a's, and a has been inside b's.
    const fromB = visitLedger(circle, visits, "b");
    expect(names(fromB.visited.map((v) => v.profile))).toEqual(["a"]);
    expect(names(fromB.hosted.map((h) => h.profile))).toEqual(["a"]);
    expect(names(fromB.toVisit)).toEqual(["c", "d", "e", "f"]);
    expect(names(fromB.toHost)).toEqual(["c", "d", "e", "f"]);
  });

  it("takes the most recent morning when a practice has been visited twice", () => {
    const circle = circleOf(["a", "b"]);
    const ledger = visitLedger(
      circle,
      [held("a", "b", "2026-01-05T09:00:00.000Z"), held("a", "b", "2026-04-05T09:00:00.000Z")],
      "a",
    );
    expect(ledger.visited).toHaveLength(1);
    expect(ledger.visited[0].at).toBe("2026-04-05T09:00:00.000Z");
  });

  it("ignores visits belonging to another circle, and ones not yet held", () => {
    const circle = circleOf(["a", "b"]);
    const elsewhere = held("a", "b", "2026-01-05T09:00:00.000Z", { circleId: "c-other" });
    const agreed = held("a", "b", "2026-09-05T09:00:00.000Z", { status: "agreed", heldAt: null });
    const declined = held("b", "a", "2026-09-06T09:00:00.000Z", { status: "declined", heldAt: null });
    const cancelled = held("b", "a", "2026-09-07T09:00:00.000Z", { status: "cancelled", heldAt: null });
    const ledger = visitLedger(circle, [elsewhere, agreed, declined, cancelled], "a");
    expect(names(ledger.toVisit)).toEqual(["b"]);
    expect(names(ledger.toHost)).toEqual(["b"]);
    expect(ledger.visited).toEqual([]);
    expect(ledger.hosted).toEqual([]);
  });
});

describe("who may do what to a visit", () => {
  const base = held("a", "b", "2026-05-01T08:30:00.000Z", { status: "proposed", heldAt: null });

  it("gives the visitor three parts of the record and the host one", () => {
    expect(noteKindsFor(base, "a")).toEqual(["observation", "takeaway", "for_host"]);
    expect(noteKindsFor(base, "b")).toEqual(["host_note"]);
    expect(noteKindsFor(base, "c")).toEqual([]);
  });

  it("asks for an answer only from the principal who did not propose", () => {
    const proposedByHost: Visit = { ...base, proposedById: "b" };
    expect(awaitingResponseFrom(proposedByHost, "a")).toBe(true);
    expect(awaitingResponseFrom(proposedByHost, "b")).toBe(false);
    // A stranger is never waited on.
    expect(awaitingResponseFrom(proposedByHost, "c")).toBe(false);
    // Nor is anyone once the morning is agreed.
    expect(awaitingResponseFrom({ ...proposedByHost, status: "agreed" }, "a")).toBe(false);
    expect(awaitingResponseFrom({ ...proposedByHost, status: "declined" }, "a")).toBe(false);
  });

  it("counts the undertaking as given only when both have given it", () => {
    expect(undertakingGiven({ ...base, visitorAgreedAt: null, hostAgreedAt: null })).toBe(false);
    expect(undertakingGiven({ ...base, visitorAgreedAt: "2026-04-01T09:00:00.000Z", hostAgreedAt: null })).toBe(false);
    expect(undertakingGiven({ ...base, visitorAgreedAt: null, hostAgreedAt: "2026-04-01T09:00:00.000Z" })).toBe(false);
    expect(undertakingGiven(base)).toBe(true);
  });
});

describe("the furnished example's visits", () => {
  it("labels every status and every part of the record", () => {
    const statuses: VisitStatus[] = ["proposed", "agreed", "declined", "held", "cancelled"];
    for (const s of statuses) expect(VISIT_STATUS_LABEL[s]).toBeTruthy();
    expect(VISIT_STATUS_LABEL.held).toBe("Held");
    for (const kind of ["observation", "takeaway", "for_host", "host_note"] as const) {
      expect(VISIT_NOTE_LABEL[kind]).toBeTruthy();
      expect(VISIT_NOTE_HELP[kind]).toBeTruthy();
    }
  });

  it("carries two distinct principals, a circle and a morning on every visit", async () => {
    const repo = new DemoRepo(emptyDelta("member"));
    const circles = await repo.listAllCircles();
    const ids = new Set(circles.map((c) => c.id));
    const visits = await repo.listVisits([...ids]);
    expect(visits.length).toBeGreaterThan(0);
    for (const v of visits) {
      expect(ids.has(v.circleId)).toBe(true);
      expect(v.visitorId).not.toBe(v.hostId);
      expect([v.visitorId, v.hostId]).toContain(v.proposedById);
      expect(Number.isNaN(new Date(v.scheduledAt).getTime())).toBe(false);
      expect(["proposed", "agreed", "declined", "held", "cancelled"]).toContain(v.status);
      expect(v.practiceName).toBeTruthy();
      // The proposer has always given their undertaking; a held morning has both.
      const proposerGiven = v.proposedById === v.visitorId ? v.visitorAgreedAt : v.hostAgreedAt;
      expect(proposerGiven).toBeTruthy();
      if (v.status === "held") {
        expect(undertakingGiven(v)).toBe(true);
        expect(v.heldAt).toBeTruthy();
        expect(new Date(v.scheduledAt).getTime()).toBeLessThan(Date.now());
      }
      if (v.status === "agreed") expect(new Date(v.scheduledAt).getTime()).toBeGreaterThan(Date.now());
    }
  });

  it("keeps every note against a held visit, by a principal allowed to write it", async () => {
    const repo = new DemoRepo(emptyDelta("member"));
    const circles = await repo.listAllCircles();
    const visits = await repo.listVisits(circles.map((c) => c.id));
    const byId = new Map(visits.map((v) => [v.id, v]));
    const notes = await repo.listVisitNotes(visits.map((v) => v.id));
    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) {
      const visit = byId.get(note.visitId);
      expect(visit).toBeTruthy();
      expect(visit!.status).toBe("held");
      expect(note.body.trim().length).toBeGreaterThan(0);
      expect(noteKindsFor(visit!, note.authorId)).toContain(note.kind);
    }
  });

  it("shows Cheng inside Adesanya's practice, with Adesanya due in Marylebone", async () => {
    const repo = new DemoRepo(emptyDelta("member"));
    const circles = await repo.listCirclesFor(IDS.cheng);
    const pair = circles.find((c) => c.kind === "pair")!;
    const visits = await repo.listVisits([pair.id]);
    const ledger = visitLedger(pair, visits, IDS.cheng);

    expect(ledger.visited.map((v) => v.profile.id)).toEqual([IDS.adesanya]);
    expect(ledger.toVisit).toEqual([]);
    // Adesanya has not yet been inside Cheng's: that morning is still in the diary.
    expect(ledger.toHost.map((p) => p.id)).toEqual([IDS.adesanya]);
    const booked = visits.find((v) => v.status === "agreed");
    expect(booked?.hostId).toBe(IDS.cheng);
    expect(booked?.visitorId).toBe(IDS.adesanya);
    expect(booked?.practiceName).toBe("Cheng Dental, Marylebone");
    expect(new Date(booked!.scheduledAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("records the pod's morning at Shah & Associates, and leaves Field waiting on an answer", async () => {
    const repo = new DemoRepo(emptyDelta("member"));
    const circles = await repo.listCirclesFor(IDS.cheng);
    const pod = circles.find((c) => c.kind === "pod")!;
    const visits = await repo.listVisits([pod.id]);
    const ledger = visitLedger(pod, visits, IDS.cheng);
    expect(ledger.visited.map((v) => v.profile.id)).toEqual([IDS.shah]);
    expect(ledger.toVisit).toHaveLength(pod.members.length - 2);
    expect(ledger.toHost).toHaveLength(pod.members.length - 1);
    // From Shah's chair, Cheng has been inside hers.
    expect(visitLedger(pod, visits, IDS.shah).hosted.map((h) => h.profile.id)).toEqual([IDS.cheng]);

    const proposed = visits.find((v) => v.status === "proposed");
    expect(proposed?.hostId).toBe(IDS.field);
    expect(awaitingResponseFrom(proposed!, IDS.cheng)).toBe(true);
    expect(awaitingResponseFrom(proposed!, IDS.field)).toBe(false);
    expect(undertakingGiven(proposed!)).toBe(false);
  });

  it("records a morning as held and opens the record to both sides", async () => {
    const repo = new DemoRepo(emptyDelta("member"));
    const visit = await repo.createVisit({
      circleId: IDS.pod,
      visitorId: IDS.cheng,
      hostId: IDS.hart,
      proposedById: IDS.cheng,
      scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
      practiceName: "Hart Dental",
    });
    expect(visit.status).toBe("proposed");
    expect(visit.visitorAgreedAt).toBeNull();
    expect(noteKindsFor(visit, IDS.cheng)).toContain("takeaway");
    expect(noteKindsFor(visit, IDS.hart)).toEqual(["host_note"]);

    const held2 = await repo.updateVisit(visit.id, { status: "held", heldAt: new Date().toISOString() });
    expect(held2.status).toBe("held");
    const note = await repo.createVisitNote({
      visitId: visit.id,
      authorId: IDS.cheng,
      kind: "takeaway",
      body: "Time the turnaround for a fortnight.",
    });
    expect(note.commitmentId).toBeNull();
    const kept = await repo.listVisitNotes([visit.id]);
    expect(kept.map((x) => x.id)).toContain(note.id);

    // A removed note is kept with an empty body; the pages filter those out.
    await repo.deleteVisitNote(note.id);
    const after = await repo.listVisitNotes([visit.id]);
    expect(after.filter((x) => x.body.trim().length > 0)).toEqual([]);
  });
});
