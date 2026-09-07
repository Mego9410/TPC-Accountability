import { describe, expect, it } from "vitest";
import {
  VISITS_A_YEAR,
  address,
  awaitingAnswerFrom,
  firstName,
  initials,
  isParty,
  otherPartyOfVisit,
  partnerIdOf,
  practiceLine,
  visitsThisYear,
  yearsLine,
  type Partnership,
  type Profile,
  type Visit,
} from "@/lib/domain";

const NOW = new Date("2026-09-07T09:00:00.000Z");

function daysBefore(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function visit(v: Partial<Visit> & Pick<Visit, "id" | "visitorId" | "hostId" | "scheduledAt">): Visit {
  return {
    proposedById: v.visitorId,
    status: "held",
    practiceName: null,
    proposalNote: null,
    arrivalNote: null,
    notes: null,
    createdAt: daysBefore(400),
    ...v,
  };
}

function partnership(p: Partial<Partnership> & Pick<Partnership, "id" | "aId" | "bId" | "proposedById">): Partnership {
  return {
    status: "proposed",
    message: null,
    startedAt: null,
    endedAt: null,
    createdAt: daysBefore(3),
    ...p,
  };
}

function profile(p: Partial<Profile>): Profile {
  return {
    id: "u-1",
    honorific: "Dr",
    fullName: "Jordan Cheng",
    email: null,
    practiceName: null,
    region: null,
    practiceType: null,
    chairCount: null,
    yearsAsPrincipal: null,
    timezone: "Europe/London",
    bio: null,
    focusAreas: [],
    openToVisits: true,
    openToPartner: false,
    membershipNo: "0149",
    role: "member",
    onboarded: true,
    nudgeOptOut: false,
    createdAt: daysBefore(200),
    ...p,
  };
}

describe("visitsThisYear", () => {
  const me = "u-me";
  const them = "u-them";

  it("counts none when nothing has been held", () => {
    expect(visitsThisYear([], me, NOW)).toBe(0);
  });

  it("counts one, whether you went or you hosted", () => {
    const asVisitor = visit({ id: "v-1", visitorId: me, hostId: them, scheduledAt: daysBefore(40) });
    const asHost = visit({ id: "v-2", visitorId: them, hostId: me, scheduledAt: daysBefore(30) });
    expect(visitsThisYear([asVisitor], me, NOW)).toBe(1);
    expect(visitsThisYear([asHost], me, NOW)).toBe(1);
  });

  it("counts two, which is the ceiling", () => {
    const held = [
      visit({ id: "v-1", visitorId: me, hostId: them, scheduledAt: daysBefore(40) }),
      visit({ id: "v-2", visitorId: them, hostId: me, scheduledAt: daysBefore(30) }),
    ];
    expect(visitsThisYear(held, me, NOW)).toBe(VISITS_A_YEAR);
  });

  it("forgets a morning held over a year ago", () => {
    const old = visit({ id: "v-old", visitorId: me, hostId: them, scheduledAt: daysBefore(400) });
    const recent = visit({ id: "v-new", visitorId: me, hostId: them, scheduledAt: daysBefore(40) });
    expect(visitsThisYear([old], me, NOW)).toBe(0);
    expect(visitsThisYear([old, recent], me, NOW)).toBe(1);
  });

  it("ignores mornings that were only proposed, declined or cancelled, and other people's", () => {
    const mine = [
      visit({ id: "v-p", visitorId: me, hostId: them, scheduledAt: daysBefore(10), status: "proposed" }),
      visit({ id: "v-d", visitorId: me, hostId: them, scheduledAt: daysBefore(11), status: "declined" }),
      visit({ id: "v-c", visitorId: me, hostId: them, scheduledAt: daysBefore(12), status: "cancelled" }),
      visit({ id: "v-a", visitorId: me, hostId: them, scheduledAt: daysBefore(13), status: "agreed" }),
      visit({ id: "v-other", visitorId: "u-x", hostId: "u-y", scheduledAt: daysBefore(14) }),
    ];
    expect(visitsThisYear(mine, me, NOW)).toBe(0);
  });
});

describe("the two parties", () => {
  const p = partnership({ id: "p-1", aId: "u-a", bId: "u-b", proposedById: "u-a" });

  it("names the other principal from either side", () => {
    expect(partnerIdOf(p, "u-a")).toBe("u-b");
    expect(partnerIdOf(p, "u-b")).toBe("u-a");
  });

  it("knows who is in it", () => {
    expect(isParty(p, "u-a")).toBe(true);
    expect(isParty(p, "u-b")).toBe(true);
    expect(isParty(p, "u-c")).toBe(false);
  });

  it("names the other party to a visit from either side", () => {
    const v = visit({ id: "v-1", visitorId: "u-a", hostId: "u-b", scheduledAt: daysBefore(1) });
    expect(otherPartyOfVisit(v, "u-a")).toBe("u-b");
    expect(otherPartyOfVisit(v, "u-b")).toBe("u-a");
  });
});

describe("awaitingAnswerFrom", () => {
  it("waits on whoever did not ask", () => {
    const p = partnership({ id: "p-1", aId: "u-a", bId: "u-b", proposedById: "u-a" });
    expect(awaitingAnswerFrom(p, "u-b")).toBe(true);
    expect(awaitingAnswerFrom(p, "u-a")).toBe(false);
  });

  it("waits on nobody once it has been answered", () => {
    for (const status of ["active", "declined", "ended"] as const) {
      const p = partnership({ id: "p-1", aId: "u-a", bId: "u-b", proposedById: "u-a", status });
      expect(awaitingAnswerFrom(p, "u-b")).toBe(false);
    }
  });

  it("reads a visit the same way", () => {
    const v = visit({ id: "v-1", visitorId: "u-a", hostId: "u-b", scheduledAt: daysBefore(-10), status: "proposed", proposedById: "u-a" });
    expect(awaitingAnswerFrom(v, "u-b")).toBe(true);
    expect(awaitingAnswerFrom(v, "u-a")).toBe(false);
    expect(awaitingAnswerFrom({ ...v, status: "agreed" }, "u-b")).toBe(false);
  });
});

describe("how a principal is written", () => {
  it("addresses by honorific and surname", () => {
    expect(address(profile({ fullName: "Jordan Cheng", honorific: "Dr" }))).toBe("Dr Cheng");
    expect(address(profile({ fullName: "Dr Amara Adesanya", honorific: "Dr" }))).toBe("Dr Adesanya");
    expect(address(profile({ fullName: "Eleanor Mary Hart", honorific: "Mrs" }))).toBe("Mrs Hart");
    expect(address(profile({ fullName: "", honorific: "Dr" }))).toBe("Principal");
  });

  it("gives a first name for the plainer moments", () => {
    expect(firstName(profile({ fullName: "Dr Amara Adesanya" }))).toBe("Amara");
    expect(firstName(profile({ fullName: "" }))).toBe("there");
  });

  it("takes initials from the first and last name", () => {
    expect(initials("Jordan Cheng")).toBe("JC");
    expect(initials("Dr Amara Adesanya")).toBe("AA");
    expect(initials("Priya")).toBe("P");
    expect(initials(null)).toBe("P");
  });

  it("writes the practice line, leaving out what is not known", () => {
    expect(
      practiceLine(
        profile({ practiceName: "Cheng Dental, Marylebone", region: "London", chairCount: 4, practiceType: "Mixed" }),
      ),
    ).toBe("Cheng Dental, Marylebone · London · 4 chairs · Mixed");
    expect(practiceLine(profile({ practiceName: "Delaney Dental", chairCount: 1 }))).toBe("Delaney Dental · 1 chair");
    expect(practiceLine(profile({}))).toBe("");
  });

  it("writes the years line, or nothing at all", () => {
    expect(yearsLine(profile({ yearsAsPrincipal: null }))).toBeNull();
    expect(yearsLine(profile({ yearsAsPrincipal: 0 }))).toBe("Not yet a principal");
    expect(yearsLine(profile({ yearsAsPrincipal: 1 }))).toBe("First year as a principal");
    expect(yearsLine(profile({ yearsAsPrincipal: 14 }))).toBe("14 years a principal");
  });
});
