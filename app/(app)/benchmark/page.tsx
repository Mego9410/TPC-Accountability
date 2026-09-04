import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canSeeSociety, requireViewer } from "@/lib/session";
import type { BenchmarkEntry, CohortStat } from "@/lib/domain";
import { BENCHMARK_METRICS, MIN_COHORT, formatMetric, formatPeriod, monthPeriod, recentMonthPeriods, type BenchmarkMetric } from "@/lib/benchmarks";
import { Button, Caption, Card, Eyebrow, H3, HairlineList, HairlineRow, PageHeader, RangeBar, Section, Sparkline, Stat } from "@/components/ui";
import { Form, SubmitButton, FField as Field, FSelect as Select } from "@/components/ui/form";
import { saveBenchmarkEntry } from "@/lib/actions/benchmarks";

export const metadata: Metadata = { title: "The benchmark" };

export default async function BenchmarkPage() {
  const { profile, repo, userId } = await requireViewer();
  if (!canSeeSociety(profile)) redirect("/upgrade");

  const entries = [...(await repo.listBenchmarkEntries(userId))].sort((a, b) => a.period.localeCompare(b.period));
  const needsProfile = !profile.region || !profile.practiceType;

  const withData = BENCHMARK_METRICS.map((m) => ({ metric: m, series: entries.filter((e) => e.metricKey === m.key) })).filter((x) => x.series.length > 0);
  const without = BENCHMARK_METRICS.filter((m) => !withData.some((x) => x.metric.key === m.key));
  const cohorts = await Promise.all(
    withData.map(({ metric, series }) => {
      const latest = series[series.length - 1];
      return repo.cohortStats(metric.key, latest.period, profile.region, profile.practiceType);
    }),
  );

  const periods = recentMonthPeriods(12).map((p) => ({ value: p, label: formatPeriod(p) }));

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="The Society"
        title="The benchmark."
        lede="Your figures against practices like yours, anonymously. No individual's number is ever shown; a cohort appears only once at least five practices have reported."
      />

      {needsProfile && (
        <Card emphasis>
          <Eyebrow>Before you compare</Eyebrow>
          <H3>Set your region and practice type.</H3>
          <Caption>The cohort is built from principals in your region running the same kind of practice. Without both, your figures are kept but compared to no one.</Caption>
          <div className="row">
            <Button href="/settings#practice" size="sm">Your practice</Button>
          </div>
        </Card>
      )}

      <div className="grid-sidebar">
        <div className="stack gap-6">
          {withData.length === 0 ? (
            <Card>
              <Eyebrow>Nothing reported yet</Eyebrow>
              <H3>One number unlocks your cohort comparison.</H3>
              <Caption>Record last month&rsquo;s turnover, or the new patients you saw, and the band appears beside it.</Caption>
            </Card>
          ) : (
            withData.map(({ metric, series }, i) => <MetricCard key={metric.key} metric={metric} series={series} cohort={cohorts[i]} />)
          )}
        </div>

        <div className="stack gap-6">
          <Card>
            <Eyebrow>Record a figure</Eyebrow>
            <Form action={saveBenchmarkEntry} resetOnSuccess>
              <>
                <Select
                  label="Figure"
                  name="metric_key"
                  options={BENCHMARK_METRICS.map((m) => ({ value: m.key, label: m.label }))}
                />
                <Select label="Month" name="period" options={periods} defaultValue={monthPeriod()} />
                <Field label="Value" name="value" type="number" step="any" inputMode="decimal" min={0} required help="Pounds, a percentage, or a count, as the figure asks." />
                <div className="form-actions">
                  <SubmitButton>Record the figure</SubmitButton>
                </div>
              </>
            </Form>
          </Card>

          {without.length > 0 && (
            <Section title="Not yet reported">
              <HairlineList>
                {without.map((m) => (
                  <HairlineRow key={m.key} date={m.short} title={m.label} meta={m.help} />
                ))}
              </HairlineList>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- One metric ---------- */

function MetricCard({ metric, series, cohort }: { metric: BenchmarkMetric; series: BenchmarkEntry[]; cohort: CohortStat | null }) {
  const latest = series[series.length - 1];
  const first = series[0];
  const fmt = (n: number) => formatMetric(metric.kind, n);
  const value = latest.value;

  return (
    <Card>
      <div className="row between wrap">
        <H3>{metric.label}</H3>
        <Caption>{metric.help}</Caption>
      </div>
      <div className="stat-row">
        <Stat value={fmt(value)} label={formatPeriod(latest.period)} sub="your latest figure" tone="gold" />
        {cohort && <Stat value={fmt(cohort.median)} label="Cohort median" sub={`${cohort.cohortSize} practices`} />}
      </div>

      {cohort ? (
        <>
          <RangeBar
            min={Math.min(cohort.p25 * 0.8, value * 0.9)}
            max={Math.max(cohort.p75 * 1.2, value * 1.1)}
            p25={cohort.p25}
            p75={cohort.p75}
            median={cohort.median}
            value={value}
            format={fmt}
          />
          <Caption>{cohortSentence(metric, cohort, value)}</Caption>
        </>
      ) : (
        <Caption>Not enough practices have reported this figure yet. A cohort appears once {MIN_COHORT} have.</Caption>
      )}

      {series.length >= 2 ? (
        <div className="row gap-5 wrap items-start">
          <Sparkline values={series.map((e) => e.value)} width={200} height={44} />
          <Caption>
            <time dateTime={first.period}>{formatPeriod(first.period)}</time> {fmt(first.value)} →{" "}
            <time dateTime={latest.period}>{formatPeriod(latest.period)}</time> {fmt(value)}, {changeSentence(metric, first.value, value)}.
          </Caption>
        </div>
      ) : (
        <Caption>One month reported. A second makes a trend.</Caption>
      )}
    </Card>
  );
}

function cohortSentence(metric: BenchmarkMetric, cohort: CohortStat, value: number): string {
  const where = cohort.scope === "cohort" ? "practices like yours" : "practices across the Club";
  const diff = value - cohort.median;
  const fmt = (n: number) => formatMetric(metric.kind, n);
  const by = metric.kind === "percent" ? `${Math.round(Math.abs(diff) * 10) / 10} points` : fmt(Math.abs(diff));
  const stand = Math.abs(diff) < 1e-9 ? "You are at the median." : `You are ${diff > 0 ? "above" : "below"} the median by ${by}.`;
  return `Among ${cohort.cohortSize} ${where}: median ${fmt(cohort.median)}. ${stand}`;
}

function changeSentence(metric: BenchmarkMetric, from: number, to: number): string {
  const diff = to - from;
  if (Math.abs(diff) < 1e-9) return "unchanged";
  const by = metric.kind === "percent" ? `${Math.round(Math.abs(diff) * 10) / 10} points` : formatMetric(metric.kind, Math.abs(diff));
  return `${diff > 0 ? "up" : "down"} ${by}`;
}
