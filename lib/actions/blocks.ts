"use server";

import { z } from "zod";
import { defineAction, zDate, zInt, zOptText, zText } from "./define";
import { BLOCK_WEEKS } from "@/lib/domain";
import { clampWeek, currentBlockWeek } from "@/lib/weeks";

async function ownBlock(ctx: { userId: string; repo: import("@/lib/repo/types").Repo }, blockId: string) {
  const block = await ctx.repo.getBlock(blockId);
  if (!block || block.userId !== ctx.userId) throw new Error("That block is not yours.");
  return block;
}

export const createBlock = defineAction({
  schema: z.object({
    title: zText("A title", 120),
    description: zOptText(600),
    start_date: zDate,
    template_id: z.string().optional(),
  }),
  run: async (ctx, input) => {
    const active = (await ctx.repo.listBlocks(ctx.userId)).filter((b) => b.status === "active");
    for (const b of active) await ctx.repo.updateBlock(b.id, { status: "completed" });

    const block = await ctx.repo.createBlock({
      userId: ctx.userId,
      title: input.title,
      description: input.description,
      startDate: input.start_date,
      templateId: input.template_id || null,
    });
    if (input.template_id) {
      const template = await ctx.repo.getTemplate(input.template_id);
      for (const w of template?.weeks ?? []) {
        await ctx.repo.createCommitment({ blockId: block.id, userId: ctx.userId, week: w.week, text: w.text });
      }
    }
    return { redirectTo: `/blocks/${block.id}`, message: "Your block is set." };
  },
});

export const setBlockStatus = defineAction({
  schema: z.object({ block_id: z.string(), status: z.enum(["active", "completed", "abandoned"]) }),
  run: async (ctx, input) => {
    await ownBlock(ctx, input.block_id);
    await ctx.repo.updateBlock(input.block_id, { status: input.status });
    return { message: input.status === "completed" ? "Block closed. Well kept." : "Block updated." };
  },
});

export const addCommitment = defineAction({
  schema: z.object({
    block_id: z.string(),
    week: zInt(1, BLOCK_WEEKS, "Week"),
    text: zText("The commitment", 200),
  }),
  run: async (ctx, input) => {
    await ownBlock(ctx, input.block_id);
    await ctx.repo.createCommitment({ blockId: input.block_id, userId: ctx.userId, week: input.week, text: input.text });
    return { message: "Set down." };
  },
});

export const setCommitmentStatus = defineAction({
  schema: z.object({ commitment_id: z.string(), status: z.enum(["open", "done", "partial", "missed"]) }),
  run: async (ctx, input) => {
    const all = await ctx.repo.listCommitmentsFor([ctx.userId]);
    const c = all.find((x) => x.id === input.commitment_id);
    if (!c) throw new Error("That commitment is not yours.");
    await ctx.repo.updateCommitment(c.id, { status: input.status });
    return { message: input.status === "done" ? "Kept." : "Noted." };
  },
});

export const carryCommitment = defineAction({
  schema: z.object({ commitment_id: z.string() }),
  run: async (ctx, input) => {
    const all = await ctx.repo.listCommitmentsFor([ctx.userId]);
    const c = all.find((x) => x.id === input.commitment_id);
    if (!c) throw new Error("That commitment is not yours.");
    const block = await ownBlock(ctx, c.blockId);
    const nextWeek = Math.min(BLOCK_WEEKS, Math.max(c.week + 1, clampWeek(currentBlockWeek(block))));
    if (nextWeek === c.week) throw new Error("This is the last week of the block; it cannot be carried.");
    await ctx.repo.updateCommitment(c.id, { status: "carried" });
    await ctx.repo.createCommitment({ blockId: c.blockId, userId: ctx.userId, week: nextWeek, text: c.text, carriedFrom: c.id });
    return { message: `Carried to week ${nextWeek}.` };
  },
});

export const editCommitment = defineAction({
  schema: z.object({ commitment_id: z.string(), text: zText("The commitment", 200) }),
  run: async (ctx, input) => {
    const all = await ctx.repo.listCommitmentsFor([ctx.userId]);
    const c = all.find((x) => x.id === input.commitment_id);
    if (!c) throw new Error("That commitment is not yours.");
    await ctx.repo.updateCommitment(c.id, { text: input.text });
    return { message: "Reworded." };
  },
});
