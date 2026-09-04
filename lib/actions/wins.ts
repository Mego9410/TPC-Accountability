"use server";

import { z } from "zod";
import { defineAction, zOptText, zText } from "./define";

export const logWin = defineAction({
  schema: z.object({ title: zText("The win", 140), detail: zOptText(600), block_id: z.string().optional() }),
  run: async (ctx, input) => {
    const blocks = await ctx.repo.listBlocks(ctx.userId);
    const active = blocks.find((b) => b.status === "active");
    const blockId = input.block_id && blocks.some((b) => b.id === input.block_id) ? input.block_id : active?.id ?? null;
    await ctx.repo.createWin({ userId: ctx.userId, title: input.title, detail: input.detail, blockId });
    return { message: "Logged. It stays on the record." };
  },
});

export const archiveWin = defineAction({
  schema: z.object({ win_id: z.string(), restore: z.string().optional() }),
  run: async (ctx, input) => {
    const wins = await ctx.repo.listWins(ctx.userId, true);
    if (!wins.some((w) => w.id === input.win_id)) throw new Error("That win is not yours.");
    await ctx.repo.updateWin(input.win_id, { archivedAt: input.restore ? null : new Date().toISOString() });
    return { message: input.restore ? "Restored." : "Archived. Never deleted." };
  },
});
