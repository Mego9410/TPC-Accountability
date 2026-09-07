"use server";

import { z } from "zod";
import { defineAction, zDate, zOptText, zText } from "./define";
import { partnerIdOf } from "@/lib/domain";
import type { Viewer } from "@/lib/session";

/** Your goals are yours. Your partner may read them and write against them. */
async function partnerId(ctx: Viewer): Promise<string | null> {
  const active = (await ctx.repo.listPartnerships(ctx.userId)).find((p) => p.status === "active");
  return active ? partnerIdOf(active, ctx.userId) : null;
}

export const addGoal = defineAction({
  schema: z.object({
    title: zText("The goal", 160),
    detail: zOptText(600),
    target_date: z.union([zDate, z.literal("")]).optional(),
  }),
  run: async (ctx, input) => {
    await ctx.repo.createGoal({
      userId: ctx.userId,
      title: input.title,
      detail: input.detail,
      targetDate: input.target_date || null,
    });
    return { message: "Set down. Your partner can see it." };
  },
});

export const editGoal = defineAction({
  schema: z.object({
    goal_id: z.string(),
    title: zText("The goal", 160),
    detail: zOptText(600),
    target_date: z.union([zDate, z.literal("")]).optional(),
  }),
  run: async (ctx, input) => {
    const goal = await ctx.repo.getGoal(input.goal_id);
    if (!goal || goal.userId !== ctx.userId) throw new Error("That goal is not yours.");
    await ctx.repo.updateGoal(goal.id, {
      title: input.title,
      detail: input.detail,
      targetDate: input.target_date || null,
    });
    return { message: "Saved." };
  },
});

export const setGoalStatus = defineAction({
  schema: z.object({ goal_id: z.string(), status: z.enum(["open", "done"]) }),
  run: async (ctx, input) => {
    const goal = await ctx.repo.getGoal(input.goal_id);
    if (!goal || goal.userId !== ctx.userId) throw new Error("That goal is not yours.");
    await ctx.repo.updateGoal(goal.id, {
      status: input.status,
      doneAt: input.status === "done" ? new Date().toISOString() : null,
    });
    return { message: input.status === "done" ? "Done. Well kept." : "Opened again." };
  },
});

/** A line of progress, from you or from your partner. */
export const addGoalUpdate = defineAction({
  schema: z.object({ goal_id: z.string(), body: zText("A word", 800) }),
  run: async (ctx, input) => {
    const goal = await ctx.repo.getGoal(input.goal_id);
    if (!goal) throw new Error("No such goal.");
    const mine = goal.userId === ctx.userId;
    if (!mine && (await partnerId(ctx)) !== goal.userId) {
      throw new Error("Only the two of you may write against this goal.");
    }
    await ctx.repo.createGoalUpdate({ goalId: goal.id, authorId: ctx.userId, body: input.body });
    return { message: mine ? "Noted." : "Written. They will see it." };
  },
});
