import type { Metadata } from "next";
import { format, subMonths } from "date-fns";
import { requireUserProfile, surnameAddress } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isPreviewMode } from "@/lib/preview";
import {
  demoBenchmarkEntries,
  demoCheckIns,
  demoCommitments,
  demoGoalBlocks,
  demoWins,
} from "@/lib/accountability-demo";
import { Body, Button, Card, Caption, Display, Divider, Eyebrow, H3 } from "@/components/ui";
import { PrintButton } from "@/components/accountability/print-button";
import { checkInStreak } from "@/lib/accountability";
import { BENCHMARK_METRICS, formatMetric, formatPeriod } from "@/lib/benchmarks";
import type { BenchmarkEntry, CheckIn, Commitment, GoalBlock, Win } from "@/lib/types";

export const metadata: Metadata = { title: "Your review" };

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const isQuarter = range === "quarter";
  const months = isQuarter ? 3 : 12;
  const since = subMonths(new Date(), months);
  const sinceISO = since.toISOString();
  const label = isQuarter ? "quarter" : "year";

  const { profile } = await requireUserProfile();
  const preview = await isPreviewMode();

  let blocks: GoalBlock[];
  let commitments: Pick<Commitment, "status" | "created_at">[];
  let checkIns: Pick<CheckIn, "completed_at">[];
  let wins: Win[];
  let benchmarks: BenchmarkEntry[];

  if (preview) {
    blocks = demoGoalBlocks;
    commitments = demoCommitments.map((c) => ({ status: c.status, created_at: c.created_at }));
    checkIns = demoCheckIns.map((c) => ({ completed_at: c.completed_at }));
    wins = demoWins;
    benchmarks = demoBenchmarkEntries;
  } else {
    const supabase = await createClient();

    const [{ data: blockRows }, { data: commitmentRows }, { data: checkInRows }, { data: winRows }, { data: benchRows }] =
      await Promise.all([
        supabase.from("goal_blocks").select("*").gte("created_at", sinceISO),
        supabase.from("commitments").select("status, created_at").gte("created_at", sinceISO),
        supabase.from("check_ins").select("completed_at").order("completed_at", { ascending: false }).limit(80),
        supabase.from("wins").select("*").is("archived_at", null).gte("created_at", sinceISO),
        supabase.from("benchmark_entries").select("*").order("period", { ascending: true }),
      ]);

    blocks = (blockRows ?? []) as GoalBlock[];
    commitments = (commitmentRows ?? []) as Pick<Commitment, "status" | "created_at">[];
    checkIns = (checkInRows ?? []) as Pick<CheckIn, "completed_at">[];
    wins = (winRows ?? []) as Win[];
    benchmarks = (benchRows ?? []) as BenchmarkEntry[];
  }

  const blocksCompleted = blocks.filter((b) => b.status === "completed").length;
  const counted = commitments.filter((c) => c.status !== "carried");
  const done = counted.filter((c) => c.status === "done").length;
  const hitPct = counted.length > 0 ? Math.round((100 * done) / counted.length) : 0;
  const streak = checkInStreak(checkIns);
  const checkInsInPeriod = checkIns.filter((c) => new Date(c.completed_at) >= since).length;

  const sincePeriod = `${since.getUTCFullYear()}-${String(since.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const movement = BENCHMARK_METRICS.map((m) => {
    const series = benchmarks.filter((e) => e.metric_key === m.key && e.period >= sincePeriod);
    if (series.length < 2) return null;
    const first = series[0];
    const last = series[series.length - 1];
    return {
      metric: m,
      first,
      last,
      delta: last.metric_value - first.metric_value,
    };
  }).filter(Boolean) as Array<{ metric: (typeof BENCHMARK_METRICS)[number]; first: BenchmarkEntry; last: BenchmarkEntry; delta: number }>;

  return (
    <div className="section fade-enter">
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div>
          <Eyebrow>Your {label} in review</Eyebrow>
          <Display>{surnameAddress(profile)}.</Display>
        </div>
        <div className="row gap-4">
          <Button href={`/accountability/review?range=${isQuarter ? "year" : "quarter"}`} variant="ghost" size="sm">
            View the {isQuarter ? "year" : "quarter"}
          </Button>
          <PrintButton />
        </div>
      </div>
      <Body lg className="muted" style={{ maxWidth: 640 }}>
        A summary of what you set out to do and what you kept, over the last{" "}
        {isQuarter ? "three months" : "twelve months"}.
      </Body>

      <Divider />

      <div className="grid-2">
        <Card emphasis>
          <Eyebrow>Blocks completed</Eyebrow>
          <Display style={{ fontSize: 44 }}>{blocksCompleted}</Display>
          <Caption>Twelve-week blocks brought to a close.</Caption>
        </Card>
        <Card emphasis>
          <Eyebrow>Commitments kept</Eyebrow>
          <Display style={{ fontSize: 44 }}>{hitPct}%</Display>
          <Caption>
            {done} of {counted.length} commitments marked done.
          </Caption>
        </Card>
        <Card emphasis>
          <Eyebrow>Check-in streak</Eyebrow>
          <Display style={{ fontSize: 44 }}>{streak}</Display>
          <Caption>{checkInsInPeriod} check-ins this {label}.</Caption>
        </Card>
        <Card emphasis>
          <Eyebrow>Wins logged</Eyebrow>
          <Display style={{ fontSize: 44 }}>{wins.length}</Display>
          <Caption>Moments worth keeping.</Caption>
        </Card>
      </div>

      <Divider />

      <H3>Benchmark movement</H3>
      {movement.length === 0 ? (
        <Caption>Report figures across two or more months to see movement here.</Caption>
      ) : (
        <div className="stack gap-4" style={{ marginTop: 12 }}>
          {movement.map((mv) => {
            const up = mv.delta >= 0;
            return (
              <Card key={mv.metric.key}>
                <div className="row between">
                  <H3>{mv.metric.label}</H3>
                  <Caption>
                    {formatPeriod(mv.first.period)} → {formatPeriod(mv.last.period)}
                  </Caption>
                </div>
                <Caption style={{ marginTop: 6 }}>
                  {formatMetric(mv.metric.kind, mv.first.metric_value)} →{" "}
                  <strong>{formatMetric(mv.metric.kind, mv.last.metric_value)}</strong> (
                  {up ? "+" : ""}
                  {formatMetric(mv.metric.kind, mv.delta)})
                </Caption>
              </Card>
            );
          })}
        </div>
      )}

      {wins.length > 0 && (
        <>
          <Divider />
          <H3>Your wins this {label}</H3>
          <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>
            {wins.map((w) => (
              <li key={w.id}>
                <Caption>
                  {w.title}{" "}
                  <span style={{ color: "var(--fg-muted)" }}>
                    · {format(new Date(w.created_at), "d MMM yyyy")}
                  </span>
                </Caption>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
