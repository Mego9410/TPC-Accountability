import { describe, expect, it } from "vitest";
import { blockEndDate, checkInStreak, clampWeek, consistencyScore, currentBlockWeek, isoWeekKey, weekKeysBack } from "@/lib/weeks";

const monday = (iso: string) => new Date(`${iso}T12:00:00`);

describe("week keys", () => {
  it("keys a week by its Monday, ISO style", () => {
    expect(isoWeekKey(monday("2026-09-02"))).toBe("2026-W36");
    expect(isoWeekKey(monday("2026-08-31"))).toBe("2026-W36");
    expect(isoWeekKey(monday("2026-09-06"))).toBe("2026-W36");
    expect(isoWeekKey(monday("2026-09-07"))).toBe("2026-W37");
  });
  it("walks back consecutive weeks", () => {
    expect(weekKeysBack(3, monday("2026-09-02"))).toEqual(["2026-W36", "2026-W35", "2026-W34"]);
  });
});

describe("blocks", () => {
  it("runs twelve weeks", () => {
    expect(blockEndDate("2026-08-03")).toBe("2026-10-26");
  });
  it("counts the current week from the start Monday", () => {
    expect(currentBlockWeek({ startDate: "2026-08-03" }, monday("2026-08-03"))).toBe(1);
    expect(currentBlockWeek({ startDate: "2026-08-03" }, monday("2026-08-31"))).toBe(5);
    expect(currentBlockWeek({ startDate: "2026-08-03" }, monday("2026-07-20"))).toBe(-1);
    expect(clampWeek(-1)).toBe(1);
    expect(clampWeek(40)).toBe(12);
  });
});

describe("streak", () => {
  const now = monday("2026-09-02"); // W36
  it("is zero with no check-ins", () => {
    expect(checkInStreak([], now)).toBe(0);
  });
  it("counts consecutive weeks up to this week", () => {
    expect(checkInStreak([{ weekKey: "2026-W36" }, { weekKey: "2026-W35" }, { weekKey: "2026-W34" }], now)).toBe(3);
  });
  it("forgives an empty current week", () => {
    expect(checkInStreak([{ weekKey: "2026-W35" }, { weekKey: "2026-W34" }], now)).toBe(2);
  });
  it("breaks on a gap", () => {
    expect(checkInStreak([{ weekKey: "2026-W36" }, { weekKey: "2026-W34" }], now)).toBe(1);
  });
});

describe("consistency", () => {
  it("is 100 when every week is checked in and every commitment kept", () => {
    const score = consistencyScore({
      block: { startDate: "2026-08-03" },
      commitments: [{ status: "done" }, { status: "done" }],
      checkInWeekKeys: new Set(["2026-W32", "2026-W33", "2026-W34", "2026-W35", "2026-W36"]),
      now: monday("2026-09-02"),
    });
    expect(score).toBe(100);
  });
  it("ignores carried commitments and halves partial ones", () => {
    const score = consistencyScore({
      block: { startDate: "2026-08-03" },
      commitments: [{ status: "done" }, { status: "partial" }, { status: "carried" }, { status: "missed" }],
      checkInWeekKeys: new Set(["2026-W32", "2026-W33", "2026-W34", "2026-W35", "2026-W36"]),
      now: monday("2026-09-02"),
    });
    // check-in rate 1.0; commitment rate (2 - 0.5) / 3 = 0.5 → 0.5*1 + 0.5*0.5 = 0.75
    expect(score).toBe(75);
  });
});
