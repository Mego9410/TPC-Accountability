"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BENCHMARK_METRICS } from "@/lib/benchmarks";
import type { ActionState } from "@/lib/accountability";

/**
 * Save (or overwrite) a member's own monthly KPI value (master doc 3.3/3.4).
 * Strictly own rows — RLS keeps benchmark_entries private; aggregates are only
 * ever served through benchmark_cohort_stats() with the ≥5 guard.
 */
export async function saveBenchmarkEntry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const metricKey = String(formData.get("metric_key") ?? "");
  const period = String(formData.get("period") ?? "");
  const valueRaw = String(formData.get("metric_value") ?? "").trim();

  const errors: Record<string, string> = {};
  if (!BENCHMARK_METRICS.some((m) => m.key === metricKey)) errors.metric_key = "Choose a metric.";
  if (!period || Number.isNaN(new Date(`${period}T00:00:00`).getTime())) errors.period = "Choose a month.";
  const value = Number(valueRaw);
  if (!valueRaw || Number.isNaN(value) || value < 0) errors.metric_value = "Enter a number.";
  if (Object.keys(errors).length) return { ok: false, message: null, errors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session has expired.", errors: {} };

  const { error } = await supabase
    .from("benchmark_entries")
    .upsert(
      { user_id: user.id, period, metric_key: metricKey, metric_value: value },
      { onConflict: "user_id,period,metric_key" },
    );
  if (error) return { ok: false, message: "We couldn't save that figure.", errors: {} };

  revalidatePath("/accountability/benchmark");
  return { ok: true, message: "Figure saved. Your benchmark is updated.", errors: {} };
}
