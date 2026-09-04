"use server";

import { z } from "zod";
import { defineAction, zDate, zOptText, zText } from "./define";

export const joinChallenge = defineAction({
  schema: z.object({ challenge_id: z.string(), leaderboard: z.string().optional() }),
  run: async (ctx, input) => {
    if (!(await ctx.repo.getChallenge(input.challenge_id))) throw new Error("No such challenge.");
    const mine = (await ctx.repo.listParticipation(ctx.userId)).find((p) => p.challengeId === input.challenge_id);
    await ctx.repo.setParticipation({
      challengeId: input.challenge_id,
      userId: ctx.userId,
      progress: mine?.progress ?? 0,
      leaderboardOptIn: input.leaderboard === "on",
    });
    return { message: mine ? "Preference saved." : "You are in." };
  },
});

export const updateProgress = defineAction({
  schema: z.object({
    challenge_id: z.string(),
    progress: z.coerce.number({ message: "Enter a number." }).min(0, "Cannot be negative.").max(100000, "Too large."),
  }),
  run: async (ctx, input) => {
    const mine = (await ctx.repo.listParticipation(ctx.userId)).find((p) => p.challengeId === input.challenge_id);
    if (!mine) throw new Error("Join the challenge first.");
    await ctx.repo.setParticipation({ ...mine, progress: input.progress });
    return { message: "Progress recorded." };
  },
});

export const createChallenge = defineAction({
  schema: z.object({
    title: zText("A title", 100),
    description: zOptText(400),
    metric_label: zText("What is counted", 40),
    start_date: zDate,
    end_date: zDate,
  }),
  roles: ["staff"],
  run: async (ctx, input) => {
    if (input.end_date <= input.start_date) throw new Error("The challenge must end after it starts.");
    await ctx.repo.createChallenge({
      title: input.title,
      description: input.description,
      metricLabel: input.metric_label,
      startDate: input.start_date,
      endDate: input.end_date,
    });
    return { message: "Challenge opened to the Club." };
  },
});
