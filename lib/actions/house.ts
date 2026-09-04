"use server";

import { z } from "zod";
import { defineAction, zOptText, zText } from "./define";

/** Staff-only: circles and seats. */
export const createCircle = defineAction({
  schema: z.object({
    kind: z.enum(["pair", "pod"]),
    name: zText("A name", 60),
    cadence: z.enum(["weekly", "fortnightly", "monthly"]),
    cohort_label: zOptText(40),
  }),
  roles: ["staff"],
  run: async (ctx, input) => {
    const circle = await ctx.repo.createCircle({ kind: input.kind, name: input.name, cadence: input.cadence, cohortLabel: input.cohort_label });
    return { message: "Circle formed.", redirectTo: `/house/circles/${circle.id}` };
  },
});

export const seatMember = defineAction({
  schema: z.object({
    circle_id: z.string(),
    user_id: z.string(),
    role: z.enum(["peer", "mentee", "mentor", "lead", "remove"]),
  }),
  roles: ["staff"],
  run: async (ctx, input) => {
    const circle = await ctx.repo.getCircle(input.circle_id);
    if (!circle) throw new Error("No such circle.");
    if (input.role === "remove") {
      await ctx.repo.setCircleMember(circle.id, input.user_id, null);
      return { message: "Seat vacated." };
    }
    if (circle.kind === "pair" && input.role !== "remove") {
      const others = circle.members.filter((m) => m.userId !== input.user_id);
      if (others.length >= 2) throw new Error("A pair has two seats.");
    }
    await ctx.repo.setCircleMember(circle.id, input.user_id, input.role);
    return { message: "Seated." };
  },
});

export const setMemberRole = defineAction({
  schema: z.object({ user_id: z.string(), role: z.enum(["member", "mentor", "staff"]), tier: z.enum(["member", "society"]) }),
  roles: ["staff"],
  run: async (ctx, input) => {
    await ctx.repo.updateProfile(input.user_id, { role: input.role, tier: input.tier });
    return { message: "Standing updated." };
  },
});
