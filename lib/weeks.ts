/**
 * Dates, written the way the Club writes them. Formatting only — there is no
 * week maths left in the product.
 */

/** "Tuesday 29 September · 8:30 am" */
export function formatAppointment(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const time = d
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?([ap])m/i, (_m, p) => ` ${p.toLowerCase()}m`);
  return `${date} · ${time}`;
}

/** "Tue 29 Sep" */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** "29 September 2026". Accepts a date-only string as well as a timestamp. */
export function formatLongDate(iso: string): string {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "29 Sep" */
export function formatDayMonth(iso: string): string {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function relativeDays(iso: string, now = new Date()): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  const days = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1) return `in ${days} days`;
  return `${-days} days ago`;
}

/** The value a datetime-local input wants: "2026-09-29T08:30". */
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
