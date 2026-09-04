/** The benchmark metric catalogue: a small, fixed set of dentist-specific figures. */
export type MetricKind = "currency" | "percent" | "number";

export interface BenchmarkMetric {
  key: string;
  label: string;
  short: string;
  kind: MetricKind;
  help: string;
}

export const BENCHMARK_METRICS: BenchmarkMetric[] = [
  { key: "monthly_turnover", label: "Monthly turnover", short: "Turnover", kind: "currency", help: "Gross practice revenue for the month, before costs." },
  { key: "hygiene_pct", label: "Hygiene share of revenue", short: "Hygiene", kind: "percent", help: "Hygiene income as a share of the month's total." },
  { key: "treatment_acceptance_pct", label: "Treatment plan acceptance", short: "Acceptance", kind: "percent", help: "Plans accepted as a share of plans presented." },
  { key: "new_patients", label: "New patients", short: "New patients", kind: "number", help: "New patients seen for the first time this month." },
  { key: "chair_utilisation_pct", label: "Chair utilisation", short: "Utilisation", kind: "percent", help: "Booked chair hours as a share of available hours." },
];

export const MIN_COHORT = 5;

export function metricByKey(key: string): BenchmarkMetric | undefined {
  return BENCHMARK_METRICS.find((m) => m.key === key);
}

export function formatMetric(kind: MetricKind, value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (kind === "currency")
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
  if (kind === "percent") return `${Math.round(value * 10) / 10}%`;
  return new Intl.NumberFormat("en-GB").format(value);
}

/** First day of the month as the `period` (yyyy-mm-01). */
export function monthPeriod(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function monthsAgoPeriod(n: number, from = new Date()): string {
  return monthPeriod(new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - n, 1)));
}

export function recentMonthPeriods(count = 12, from = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => monthsAgoPeriod(i, from));
}

export function formatPeriod(period: string): string {
  return new Date(`${period}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export const REGIONS = [
  "London",
  "South East",
  "South West",
  "East of England",
  "East Midlands",
  "West Midlands",
  "Yorkshire and the Humber",
  "North West",
  "North East",
  "Wales",
  "Scotland",
  "Northern Ireland",
];

export const PRACTICE_TYPES = ["NHS", "Private", "Mixed"] as const;
