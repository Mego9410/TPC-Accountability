"use server";

import { z } from "zod";
import { defineAction } from "./define";
import { BENCHMARK_METRICS } from "@/lib/benchmarks";

export const saveBenchmarkEntry = defineAction({
  schema: z.object({
    metric_key: z.enum(BENCHMARK_METRICS.map((m) => m.key) as [string, ...string[]], { message: "Choose a figure." }),
    period: z.string().regex(/^\d{4}-\d{2}-01$/, "Choose a month."),
    value: z.coerce.number({ message: "Enter a number." }).min(0, "Cannot be negative.").max(1e9, "Too large."),
  }),
  run: async (ctx, input) => {
    const metric = BENCHMARK_METRICS.find((m) => m.key === input.metric_key)!;
    if (metric.kind === "percent" && input.value > 100) throw new Error("A percentage cannot exceed 100.");
    await ctx.repo.upsertBenchmarkEntry({ userId: ctx.userId, period: input.period, metricKey: input.metric_key, value: input.value });
    return { message: `${metric.label} recorded.` };
  },
});
