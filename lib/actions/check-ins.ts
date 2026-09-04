"use server";

import { z } from "zod";
import { defineAction, zInt, zOptText } from "./define";
import { BLOCK_WEEKS } from "@/lib/domain";
import { currentWeekKey } from "@/lib/weeks";

export const saveCheckIn = defineAction({
  schema: z.object({
    block_week: z.union([zInt(1, BLOCK_WEEKS, "Week"), z.literal("")]).optional(),
    did_well: z.string().trim().min(3, "Say one thing that went well, however small.").max(1000),
    struggled_with: zOptText(1000),
    next_focus: z.string().trim().min(3, "Name next week's focus.").max(500),
    energy: zInt(1, 10, "Energy"),
    circle_id: z.string().optional(),
  }),
  run: async (ctx, input) => {
    const weekKey = currentWeekKey();
    const existing = (await ctx.repo.listCheckIns(ctx.userId, 5)).find((c) => c.weekKey === weekKey);
    const circles = await ctx.repo.listCirclesFor(ctx.userId);
    const pod = circles.find((c) => c.kind === "pod") ?? circles[0] ?? null;
    const payload = {
      userId: ctx.userId,
      circleId: input.circle_id || pod?.id || null,
      weekKey,
      blockWeek: typeof input.block_week === "number" ? input.block_week : null,
      didWell: input.did_well,
      struggledWith: input.struggled_with,
      nextFocus: input.next_focus,
      energy: input.energy,
    };
    if (existing) {
      await ctx.repo.updateCheckIn(existing.id, payload);
      return { message: "This week's check-in is revised.", redirectTo: "/check-in?saved=1" };
    }
    await ctx.repo.createCheckIn(payload);
    return { message: "Checked in. Your circle can see it.", redirectTo: "/check-in?saved=1" };
  },
});
