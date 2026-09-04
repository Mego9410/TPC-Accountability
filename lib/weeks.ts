import { addWeeks, differenceInCalendarWeeks, format, startOfWeek } from "date-fns";
import { BLOCK_WEEKS, type CheckIn, type Commitment, type GoalBlock } from "@/lib/domain";

/** All week maths in one place, Monday-based, so the app never disagrees with itself. */

export function isoWeekKey(date: Date): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, "RRRR-'W'II");
}

export function currentWeekKey(now = new Date()): string {
  return isoWeekKey(now);
}

export function weekKeysBack(count: number, now = new Date()): string[] {
  const out: string[] = [];
  let cursor = startOfWeek(now, { weekStartsOn: 1 });
  for (let i = 0; i < count; i += 1) {
    out.push(isoWeekKey(cursor));
    cursor = addWeeks(cursor, -1);
  }
  return out;
}

export function blockEndDate(startISO: string): string {
  const start = new Date(`${startISO}T00:00:00`);
  return format(addWeeks(start, BLOCK_WEEKS), "yyyy-MM-dd");
}

/** 1..12 while the block runs; 0 before; 13+ after. */
export function currentBlockWeek(block: Pick<GoalBlock, "startDate">, now = new Date()): number {
  const start = new Date(`${block.startDate}T00:00:00`);
  return differenceInCalendarWeeks(now, start, { weekStartsOn: 1 }) + 1;
}

export function clampWeek(week: number): number {
  return Math.min(BLOCK_WEEKS, Math.max(1, week));
}

export function blockProgress(block: Pick<GoalBlock, "startDate">, now = new Date()) {
  const week = clampWeek(currentBlockWeek(block, now));
  return { week, pct: Math.round((week / BLOCK_WEEKS) * 100) };
}

/**
 * Consecutive-week streak, counting back from this week. This week may be
 * empty without breaking a run that reached last week.
 */
export function checkInStreak(checkIns: Pick<CheckIn, "weekKey">[], now = new Date()): number {
  const weeks = new Set(checkIns.map((c) => c.weekKey));
  if (weeks.size === 0) return 0;
  let streak = 0;
  let cursor = startOfWeek(now, { weekStartsOn: 1 });
  if (!weeks.has(isoWeekKey(cursor))) cursor = addWeeks(cursor, -1);
  while (weeks.has(isoWeekKey(cursor))) {
    streak += 1;
    cursor = addWeeks(cursor, -1);
  }
  return streak;
}

/** Share of elapsed block weeks with a check-in × share of commitments kept, 0..100. */
export function consistencyScore(args: {
  block: Pick<GoalBlock, "startDate"> | null;
  commitments: Pick<Commitment, "status">[];
  checkInWeekKeys: Set<string>;
  now?: Date;
}): number {
  const now = args.now ?? new Date();
  const elapsed = args.block
    ? clampWeek(currentBlockWeek(args.block, now))
    : args.checkInWeekKeys.size;
  if (elapsed <= 0) return 0;
  const checkInRate = Math.min(args.checkInWeekKeys.size, elapsed) / elapsed;
  const counted = args.commitments.filter((c) => c.status !== "carried");
  const kept = counted.filter((c) => c.status === "done" || c.status === "partial").length;
  const partialWeight = counted.filter((c) => c.status === "partial").length * 0.5;
  const commitmentRate = counted.length > 0 ? (kept - partialWeight) / counted.length : 1;
  return Math.round(100 * (0.5 * checkInRate + 0.5 * commitmentRate));
}

/* ---------- Formatting ---------- */

export function formatAppointment(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const time = d
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?([ap])m/i, (_m, p) => ` ${p.toLowerCase()}m`);
  return `${date} · ${time}`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function formatLongDate(iso: string): string {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDayMonth(iso: string): string {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function relativeDays(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const days = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1) return `in ${days} days`;
  return `${-days} days ago`;
}

export function weekLabel(weekKey: string): string {
  // "2026-W36" -> "w/c 31 Aug"
  const [y, w] = weekKey.split("-W").map(Number);
  const jan4 = new Date(y, 0, 4);
  const monday = startOfWeek(jan4, { weekStartsOn: 1 });
  monday.setDate(monday.getDate() + (w - 1) * 7);
  return `w/c ${monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}
