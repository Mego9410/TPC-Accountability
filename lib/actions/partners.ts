"use server";

import { z } from "zod";
import { defineAction, zOptText } from "./define";
import { partnerIdOf } from "@/lib/domain";
import type { Viewer } from "@/lib/session";

/**
 * Finding a partner is self-serve: you look through the members, you ask
 * someone, and they say yes or no. One at a time — you end the one you have
 * before you take up another.
 */

async function activePartnership(ctx: Viewer) {
  return (await ctx.repo.listPartnerships(ctx.userId)).find((p) => p.status === "active") ?? null;
}

export const askToPartner = defineAction({
  schema: z.object({ user_id: z.string().min(1, "Choose a principal."), message: zOptText(600) }),
  run: async (ctx, input) => {
    if (input.user_id === ctx.userId) throw new Error("You cannot be your own partner.");
    const them = await ctx.repo.getProfile(input.user_id);
    if (!them || them.role === "staff") throw new Error("No such member.");
    if (await activePartnership(ctx)) {
      throw new Error("You already have a partner. End that first if you would rather work with someone else.");
    }

    const existing = (await ctx.repo.listPartnerships(ctx.userId)).find(
      (p) => partnerIdOf(p, ctx.userId) === input.user_id && (p.status === "proposed" || p.status === "active"),
    );
    if (existing) throw new Error("That request is already in hand.");

    await ctx.repo.createPartnership({
      aId: ctx.userId,
      bId: them.id,
      proposedById: ctx.userId,
      message: input.message,
    });
    return { message: "Asked. They will see it the next time they look in.", redirectTo: "/partner" };
  },
});

export const answerPartnerRequest = defineAction({
  schema: z.object({ partnership_id: z.string(), answer: z.enum(["accept", "decline"]) }),
  run: async (ctx, input) => {
    const p = await ctx.repo.getPartnership(input.partnership_id);
    if (!p || (p.aId !== ctx.userId && p.bId !== ctx.userId)) throw new Error("That request is not yours.");
    if (p.status !== "proposed") throw new Error("That request has already been answered.");
    if (p.proposedById === ctx.userId) throw new Error("You asked; it is for them to answer.");

    if (input.answer === "decline") {
      await ctx.repo.updatePartnership(p.id, { status: "declined" });
      return { message: "Declined. No reason is owed, and none is recorded." };
    }
    if (await activePartnership(ctx)) {
      throw new Error("End your current partnership before taking up another.");
    }
    await ctx.repo.updatePartnership(p.id, { status: "active", startedAt: new Date().toISOString() });
    return { message: "Agreed. You can see each other's goals from now on.", redirectTo: "/partner" };
  },
});

export const withdrawPartnerRequest = defineAction({
  schema: z.object({ partnership_id: z.string() }),
  run: async (ctx, input) => {
    const p = await ctx.repo.getPartnership(input.partnership_id);
    if (!p || p.proposedById !== ctx.userId) throw new Error("That request is not yours to withdraw.");
    if (p.status !== "proposed") throw new Error("That request has already been answered.");
    await ctx.repo.updatePartnership(p.id, { status: "declined" });
    return { message: "Withdrawn." };
  },
});

export const endPartnership = defineAction({
  schema: z.object({ partnership_id: z.string() }),
  run: async (ctx, input) => {
    const p = await ctx.repo.getPartnership(input.partnership_id);
    if (!p || (p.aId !== ctx.userId && p.bId !== ctx.userId)) throw new Error("That partnership is not yours.");
    if (p.status !== "active") throw new Error("That partnership is not running.");
    await ctx.repo.updatePartnership(p.id, { status: "ended", endedAt: new Date().toISOString() });
    return { message: "Ended. Your goals are your own again." };
  },
});
