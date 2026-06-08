import { addWeeks, differenceInCalendarWeeks, format, startOfWeek } from "date-fns";
import type { CheckIn, Commitment, GoalBlock } from "@/lib/types";

/**
 * Inline-form state for useActionState-backed forms. Defined here (a plain
 * module) rather than in the "use server" actions file, which may only export
 * async functions.
 */
export type ActionState = { ok: boolean; message: string | null; errors: Record<string, string> };
export const EMPTY_ACTION_STATE: ActionState = { ok: false, message: null, errors: {} };

/** A goal block runs for twelve weeks (the Club's native framing). */
export const BLOCK_WEEKS = 12;

/** end_date for a block starting on `startISO` (start + 12 weeks). */
export function blockEndDate(startISO: string): string {
  const start = new Date(`${startISO}T00:00:00`);
  return format(addWeeks(start, BLOCK_WEEKS), "yyyy-MM-dd");
}

/**
 * Which week of the block we are in right now (1..12). Returns 0 before the
 * block starts and 13+ once it has run its course (callers clamp as needed).
 */
export function currentBlockWeek(block: Pick<GoalBlock, "start_date">, now = new Date()): number {
  const start = new Date(`${block.start_date}T00:00:00`);
  const weeks = differenceInCalendarWeeks(now, start, { weekStartsOn: 1 });
  return weeks + 1;
}

/** The active week number clamped into the 1..12 range, for UI defaults. */
export function clampWeek(week: number): number {
  return Math.min(BLOCK_WEEKS, Math.max(1, week));
}

/** Monday-based ISO week key (e.g. "2026-W23") used for streak/check-in math. */
export function isoWeekKey(date: Date): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, "RRRR-'W'II");
}

/** This week's key, for "have they checked in this week?" lookups. */
export function currentWeekKey(now = new Date()): string {
  return isoWeekKey(now);
}

/**
 * Consecutive-week streak from a member's check-ins. Counts back from the
 * current week; a gap (a week with no check-in) ends the streak. The current
 * week not yet having a check-in does not break a streak that ran up to last
 * week — it simply hasn't extended yet.
 */
export function checkInStreak(checkIns: Pick<CheckIn, "completed_at">[], now = new Date()): number {
  const weeks = new Set(checkIns.map((c) => isoWeekKey(new Date(c.completed_at))));
  if (weeks.size === 0) return 0;

  let streak = 0;
  let cursor = startOfWeek(now, { weekStartsOn: 1 });
  // Allow the current week to be empty without breaking a prior run.
  if (!weeks.has(isoWeekKey(cursor))) {
    cursor = addWeeks(cursor, -1);
  }
  while (weeks.has(isoWeekKey(cursor))) {
    streak += 1;
    cursor = addWeeks(cursor, -1);
  }
  return streak;
}

/**
 * Simple consistency score (master doc Step 2.6): the share of elapsed weeks
 * with a completed check-in, multiplied by the share of commitments kept,
 * expressed 0..100. Mirrors public.recompute_reliability in SQL so the live UI
 * and the nightly job agree.
 */
export function consistencyScore(args: {
  block: Pick<GoalBlock, "start_date"> | null;
  commitments: Pick<Commitment, "status">[];
  checkInWeekKeys: Set<string>;
  now?: Date;
}): number {
  const now = args.now ?? new Date();
  const elapsed = args.block ? clampWeek(currentBlockWeek(args.block, now)) : args.checkInWeekKeys.size;
  if (elapsed <= 0) return 0;

  const weeksWithCheckIn = Math.min(args.checkInWeekKeys.size, elapsed);
  const checkInRate = weeksWithCheckIn / elapsed;

  const counted = args.commitments.filter((c) => c.status !== "carried");
  const done = counted.filter((c) => c.status === "done").length;
  const commitmentRate = counted.length > 0 ? done / counted.length : 1;

  return Math.round(100 * checkInRate * commitmentRate);
}
