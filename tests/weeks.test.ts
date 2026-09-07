import { describe, expect, it } from "vitest";
import {
  formatAppointment,
  formatDayMonth,
  formatLongDate,
  formatShortDate,
  relativeDays,
  toLocalInputValue,
} from "@/lib/weeks";

/** Built in local time so the assertions do not move with the runner's zone. */
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min, 0, 0);

describe("dates, written the way the Club writes them", () => {
  it("writes a morning in full", () => {
    expect(formatAppointment(local(2026, 9, 29, 8, 30).toISOString())).toBe("Tuesday 29 September · 8:30 am");
  });

  it("writes a short date and a day and month", () => {
    // "Sep" or "Sept" depending on the runner's ICU data; the shape is what matters.
    expect(formatShortDate(local(2026, 9, 29, 8, 30).toISOString())).toMatch(/^Tue 29 Sept?$/);
    expect(formatDayMonth("2026-09-29")).toMatch(/^29 Sept?$/);
  });

  it("writes a long date from a date-only string as well as a timestamp", () => {
    expect(formatLongDate("2026-09-29")).toBe("29 September 2026");
    expect(formatLongDate(local(2026, 9, 29, 13, 0).toISOString())).toBe("29 September 2026");
  });
});

describe("relativeDays", () => {
  const now = local(2026, 9, 7, 12, 0);
  it("names today, tomorrow and yesterday", () => {
    expect(relativeDays(local(2026, 9, 7, 12, 0).toISOString(), now)).toBe("today");
    expect(relativeDays(local(2026, 9, 8, 12, 0).toISOString(), now)).toBe("tomorrow");
    expect(relativeDays(local(2026, 9, 6, 12, 0).toISOString(), now)).toBe("yesterday");
  });
  it("counts the rest in days, each way", () => {
    expect(relativeDays(local(2026, 9, 28, 12, 0).toISOString(), now)).toBe("in 21 days");
    expect(relativeDays(local(2026, 8, 18, 12, 0).toISOString(), now)).toBe("20 days ago");
  });
});

describe("toLocalInputValue", () => {
  it("gives a datetime-local input what it wants, in local time", () => {
    expect(toLocalInputValue(local(2026, 9, 29, 8, 30))).toBe("2026-09-29T08:30");
    expect(toLocalInputValue(local(2026, 12, 1, 14, 5))).toBe("2026-12-01T14:05");
  });
});
