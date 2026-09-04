"use server";

import { z } from "zod";
import { defineAction, zText } from "./define";
import { menteesOf } from "@/lib/domain";

/** Mentors leave notes about mentees; staff may too. */
export const addNote = defineAction({
  schema: z.object({
    about_user_id: z.string(),
    body: zText("The note", 1000),
    commitment_id: z.string().optional(),
    check_in_id: z.string().optional(),
  }),
  roles: ["mentor", "staff"],
  run: async (ctx, input) => {
    if (ctx.profile.role === "mentor") {
      const circles = await ctx.repo.listCirclesFor(ctx.userId);
      if (!menteesOf(circles, ctx.userId).some((m) => m.id === input.about_user_id)) {
        throw new Error("That principal is not one of your mentees.");
      }
    }
    await ctx.repo.createNote({
      authorId: ctx.userId,
      aboutUserId: input.about_user_id,
      body: input.body,
      commitmentId: input.commitment_id || null,
      checkInId: input.check_in_id || null,
    });
    return { message: "Note left." };
  },
});
