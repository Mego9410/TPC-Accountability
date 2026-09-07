"use server";

import { z } from "zod";
import { defineAction, zText } from "./define";

export const sendMessage = defineAction({
  schema: z.object({ to_id: z.string(), body: zText("A note", 2000) }),
  run: async (ctx, input) => {
    if (input.to_id === ctx.userId) throw new Error("You cannot write to yourself.");
    const them = await ctx.repo.getProfile(input.to_id);
    if (!them) throw new Error("No such member.");
    await ctx.repo.createMessage({ fromId: ctx.userId, toId: them.id, body: input.body });
    return { revalidate: ["/messages", "layout"] };
  },
});

export const markThreadRead = defineAction({
  schema: z.object({ with_id: z.string() }),
  run: async (ctx, input) => {
    await ctx.repo.markRead(ctx.userId, input.with_id);
    return { revalidate: ["/messages", "layout"] };
  },
});
