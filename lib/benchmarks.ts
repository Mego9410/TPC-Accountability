/**
 * Benchmark metric catalogue (master doc §8 open question #2 — start narrow).
 * A small, fixed launch set of dentist-specific KPIs. Cohort aggregates are
 * served by public.benchmark_cohort_stats with a ≥5 min-cohort guard.
 */
export type MetricKind = "currency" | "percent" | "number";

export interface BenchmarkMetric {
  key: string;
  label: string;
  kind: MetricKind;
  help?: string;
}

export const BENCHMARK_METRICS: BenchmarkMetric[] = [
  { key: "monthly_turnover", label: "Monthly turnover", kind: "currency", help: "Gross practice revenue for the month." },
  { key: "hygiene_pct", label: "Hygiene share of revenue", kind: "percent", help: "Hygiene income as a share of total." },
  { key: "treatment_acceptance_pct", label: "Treatment plan acceptance", kind: "percent" },
  { key: "new_patients", label: "New patients", kind: "number", help: "New patients seen this month." },
  { key: "chair_utilisation_pct", label: "Chair utilisation", kind: "percent" },
];

export function metricByKey(key: string): BenchmarkMetric | undefined {
  return BENCHMARK_METRICS.find((m) => m.key === key);
}

export function formatMetric(kind: MetricKind, value: number | null | undefined): string {
  if (value == null) return "—";
  if (kind === "currency")
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(value);
  if (kind === "percent") return `${Math.round(value * 10) / 10}%`;
  return new Intl.NumberFormat("en-GB").format(value);
}

/** First day of the month for a Date, as an ISO date string (the `period`). */
export function monthPeriod(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/** Last 12 month periods, newest first, for the entry month picker. */
export function recentMonthPeriods(count = 12, from = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - i, 1));
    out.push(monthPeriod(d));
  }
  return out;
}

export function formatPeriod(period: string): string {
  const d = new Date(`${period}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
