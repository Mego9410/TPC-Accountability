"use server";

import { z } from "zod";
import { defineAction, zOptText } from "./define";

export const scheduleSitting = defineAction({
  schema: z.object({
    circle_id: z.string(),
    scheduled_at: z.string().min(10, "Pick a date and time."),
    join_url: z.string().trim().url("Enter a full link, starting https://").optional().or(z.literal("")),
  }),
  run: async (ctx, input) => {
    const circles = await ctx.repo.listCirclesFor(ctx.userId);
    if (!circles.some((c) => c.id === input.circle_id)) throw new Error("You are not in that circle.");
    const when = new Date(input.scheduled_at);
    if (Number.isNaN(when.getTime())) throw new Error("That date could not be read.");
    if (when.getTime() < Date.now() - 60_000) throw new Error("Pick a time in the future.");
    const sitting = await ctx.repo.createSitting({
      circleId: input.circle_id,
      scheduledAt: when.toISOString(),
      createdBy: ctx.userId,
      joinUrl: input.join_url || null,
    });
    return { message: "The sitting is in the diary.", redirectTo: `/sittings/${sitting.id}` };
  },
});

export const updateSitting = defineAction({
  schema: z.object({
    sitting_id: z.string(),
    status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
    notes: zOptText(4000),
    join_url: z.string().trim().url("Enter a full link.").optional().or(z.literal("")),
  }),
  run: async (ctx, input) => {
    const sitting = await ctx.repo.getSitting(input.sitting_id);
    if (!sitting) throw new Error("No such sitting.");
    const circles = await ctx.repo.listCirclesFor(ctx.userId);
    if (!circles.some((c) => c.id === sitting.circleId)) throw new Error("You are not in that circle.");
    const patch: Partial<typeof sitting> = {};
    if (input.status) patch.status = input.status;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.join_url !== undefined) patch.joinUrl = input.join_url || null;
    await ctx.repo.updateSitting(sitting.id, patch);
    return { message: input.status === "completed" ? "Sitting recorded as held." : "Saved." };
  },
});
