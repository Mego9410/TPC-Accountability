import type { Metadata } from "next";
import { requireUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Body, Button, Card, Caption, Divider, Eyebrow, H1, H3 } from "@/components/ui";
import { BenchmarkEntryForm } from "@/components/accountability/benchmark-entry-form";
import { BENCHMARK_METRICS, formatMetric, formatPeriod } from "@/lib/benchmarks";
import type { BenchmarkEntry, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Benchmarking" };

type CohortStat = {
  scope: "cohort" | "club";
  cohort_size: number;
  median_value: number;
  p25: number;
  p75: number;
};

type AnySupabase = Awaited<ReturnType<typeof createClient>>;

async function cohortFor(
  supabase: AnySupabase,
  metricKey: string,
  period: string,
  profile: Pick<Profile, "region" | "practice_type">,
): Promise<CohortStat | null> {
  const cohort = await supabase.rpc("benchmark_cohort_stats", {
    p_metric: metricKey,
    p_period: period,
    p_region: profile.region,
    p_practice_type: profile.practice_type,
  });
  const cohortRow = (cohort.data ?? [])[0];
  if (cohortRow) return { scope: "cohort", ...cohortRow };

  const club = await supabase.rpc("benchmark_cohort_stats", {
    p_metric: metricKey,
    p_period: period,
    p_region: null,
    p_practice_type: null,
  });
  const clubRow = (club.data ?? [])[0];
  if (clubRow) return { scope: "club", ...clubRow };

  return null;
}

export default async function BenchmarkPage() {
  const { profile } = await requireUserProfile();
  const supabase = await createClient();
  const needsProfile = !profile.region || !profile.practice_type;

  const { data: entryRows } = await supabase
    .from("benchmark_entries")
    .select("*")
    .order("period", { ascending: true });
  const entries = (entryRows ?? []) as BenchmarkEntry[];

  const byMetric = new Map<string, BenchmarkEntry[]>();
  for (const e of entries) byMetric.set(e.metric_key, [...(byMetric.get(e.metric_key) ?? []), e]);

  // Cohort band for the latest reported month of each metric (the guard ≥5
  // means this is null until enough peers have reported).
  const metricsWithData = BENCHMARK_METRICS.filter((m) => byMetric.has(m.key));
  const cohorts = new Map<string, CohortStat | null>();
  await Promise.all(
    metricsWithData.map(async (m) => {
      const series = byMetric.get(m.key)!;
      const latest = series[series.length - 1];
      cohorts.set(m.key, await cohortFor(supabase, m.key, latest.period, profile));
    }),
  );

  return (
    <div className="section fade-enter">
      <Eyebrow>The benchmark · dentist-specific</Eyebrow>
      <H1>Where your practice stands.</H1>
      <Body className="muted" style={{ maxWidth: 640 }}>
        Report a few figures each month and see how you compare to similar
        practices — anonymously. No individual&rsquo;s number is ever shown; a
        cohort appears only once at least five practices have reported.
      </Body>

      <Divider />

      {needsProfile && (
        <Card emphasis style={{ marginBottom: 20 }}>
          <Eyebrow>First</Eyebrow>
          <H3>Set your region and practice type.</H3>
          <Caption>We need them to place you in a like-for-like cohort.</Caption>
          <div className="row" style={{ marginTop: 12 }}>
            <Button href="/accountability/profile" size="sm">
              Complete your profile
            </Button>
          </div>
        </Card>
      )}

      <Card emphasis>
        <Eyebrow>{entries.length === 0 ? "Your day-one snapshot" : "Report a figure"}</Eyebrow>
        <H3>{entries.length === 0 ? "Enter one figure to begin." : "Add this month's numbers."}</H3>
        <div style={{ marginTop: 12 }}>
          <BenchmarkEntryForm />
        </div>
      </Card>

      <div className="stack gap-6" style={{ marginTop: 28 }}>
        {metricsWithData.length === 0 ? (
          <Caption>No figures yet. Your first entry unlocks your cohort comparison.</Caption>
        ) : (
          metricsWithData.map((m) => {
            const series = byMetric.get(m.key)!;
            const latest = series[series.length - 1];
            const cohort = cohorts.get(m.key) ?? null;
            const aboveMedian = cohort ? latest.metric_value >= cohort.median_value : null;
            return (
              <Card key={m.key}>
                <div className="row between" style={{ alignItems: "flex-start" }}>
                  <div>
                    <H3>{m.label}</H3>
                    <Caption>
                      Your latest ({formatPeriod(latest.period)}):{" "}
                      <strong>{formatMetric(m.kind, latest.metric_value)}</strong>
                    </Caption>
                  </div>
                </div>

                {cohort ? (
                  <Caption style={{ marginTop: 8 }}>
                    {cohort.scope === "cohort"
                      ? `Among ${cohort.cohort_size} practices in your cohort`
                      : `Cohort too small — showing the club-wide view (${cohort.cohort_size} practices)`}
                    : median <strong>{formatMetric(m.kind, cohort.median_value)}</strong>, middle-half{" "}
                    {formatMetric(m.kind, cohort.p25)}–{formatMetric(m.kind, cohort.p75)}.{" "}
                    {aboveMedian ? "You are at or above the median." : "You are below the median."}
                  </Caption>
                ) : (
                  <Caption style={{ marginTop: 8 }}>
                    Not enough data yet in your cohort — a comparison appears once at
                    least five practices have reported this metric.
                  </Caption>
                )}

                {series.length > 1 && (
                  <div style={{ marginTop: 12 }}>
                    <Eyebrow>Your trend</Eyebrow>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: "8px 0 0",
                        display: "flex",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      {series.map((e) => (
                        <li key={e.id}>
                          <Caption>
                            {formatPeriod(e.period)}:{" "}
                            <strong>{formatMetric(m.kind, e.metric_value)}</strong>
                          </Caption>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
