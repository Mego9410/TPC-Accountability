"use client";

import { useActionState } from "react";
import { Button, Field } from "@/components/ui";
import { saveBenchmarkEntry } from "@/lib/actions/benchmarks";
import { EMPTY_ACTION_STATE } from "@/lib/accountability";
import { BENCHMARK_METRICS, formatPeriod, recentMonthPeriods } from "@/lib/benchmarks";

export function BenchmarkEntryForm({ defaultMetric }: { defaultMetric?: string }) {
  const [state, formAction, pending] = useActionState(saveBenchmarkEntry, EMPTY_ACTION_STATE);
  const periods = recentMonthPeriods(12);

  return (
    <form action={formAction} style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      {state.ok && state.message && (
        <div className="notice" role="status" style={{ flexBasis: "100%" }}>
          {state.message}
        </div>
      )}
      {!state.ok && state.message && (
        <div className="notice" role="alert" style={{ flexBasis: "100%" }}>
          {state.message}
        </div>
      )}

      <div className="field" style={{ minWidth: 200 }}>
        <label htmlFor="metric_key">Metric</label>
        <select id="metric_key" name="metric_key" defaultValue={defaultMetric ?? BENCHMARK_METRICS[0].key}>
          {BENCHMARK_METRICS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
        {state.errors.metric_key && <div className="help err">{state.errors.metric_key}</div>}
      </div>

      <div className="field" style={{ width: 150 }}>
        <label htmlFor="period">Month</label>
        <select id="period" name="period" defaultValue={periods[0]}>
          {periods.map((p) => (
            <option key={p} value={p}>
              {formatPeriod(p)}
            </option>
          ))}
        </select>
        {state.errors.period && <div className="help err">{state.errors.period}</div>}
      </div>

      <div style={{ width: 140 }}>
        <Field
          label="Value"
          name="metric_value"
          type="number"
          step="any"
          min={0}
          placeholder="0"
          error={state.errors.metric_value}
          aria-invalid={Boolean(state.errors.metric_value)}
        />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save figure"}
      </Button>
    </form>
  );
}
