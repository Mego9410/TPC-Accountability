import type { Cadence } from "@/lib/types";

export const CADENCE_LABEL: Record<Cadence, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
};

export const CADENCE_DAYS: Record<Cadence, number> = {
  weekly: 7,
  fortnightly: 14,
  monthly: 30,
};

/** Next sensible appointment from a starting point, given a cadence. */
export function nextOccurrence(from: Date, cadence: Cadence): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + CADENCE_DAYS[cadence]);
  return d;
}

/** Club-style date: "Thursday, 14 November · 7:30 pm". */
export function formatAppointment(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = d
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?([ap])m/i, (_m, p) => ` ${p.toLowerCase()}m`);
  return `${date} · ${time}`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
