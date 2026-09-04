"use server";

import { z } from "zod";
import { defineAction, zText } from "./define";

export const sendMessage = defineAction({
  schema: z.object({ circle_id: z.string(), body: zText("A note", 2000) }),
  run: async (ctx, input) => {
    const circles = await ctx.repo.listCirclesFor(ctx.userId);
    if (!circles.some((c) => c.id === input.circle_id)) throw new Error("You are not in that circle.");
    await ctx.repo.createMessage({ circleId: input.circle_id, senderId: ctx.userId, body: input.body });
    return { revalidate: ["/messages"] };
  },
});

export const markThreadRead = defineAction({
  schema: z.object({ circle_id: z.string() }),
  run: async (ctx, input) => {
    await ctx.repo.markRead(input.circle_id, ctx.userId);
    return { revalidate: ["/messages", "layout"] };
  },
});
