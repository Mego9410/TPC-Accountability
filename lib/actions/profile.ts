"use server";

import { z } from "zod";
import { defineAction, zList, zOptText, zText } from "./define";
import { HONORIFICS, TIMEZONES } from "@/lib/options";
import { PRACTICE_TYPES, REGIONS } from "@/lib/regions";

const particulars = z.object({
  honorific: z.enum(HONORIFICS as [string, ...string[]]).default("Dr"),
  full_name: zText("Your name", 80),
  timezone: z.enum(TIMEZONES as [string, ...string[]]).default("Europe/London"),
  bio: zOptText(600),
  practice_name: zOptText(120),
  region: z.enum(REGIONS as [string, ...string[]]).optional().or(z.literal("")),
  practice_type: z.enum(PRACTICE_TYPES).optional().or(z.literal("")),
  chair_count: z.union([z.coerce.number().int().min(1).max(60), z.literal("")]).optional(),
  years_as_principal: z.union([z.coerce.number().int().min(0).max(60), z.literal("")]).optional(),
  focus: zList,
  open_to_partner: z.string().optional(),
  open_to_visits: z.string().optional(),
  nudge_opt_out: z.string().optional(),
});

function toPatch(input: z.infer<typeof particulars>) {
  return {
    honorific: input.honorific,
    fullName: input.full_name,
    timezone: input.timezone,
    bio: input.bio,
    practiceName: input.practice_name,
    region: input.region || null,
    practiceType: (input.practice_type || null) as never,
    chairCount: typeof input.chair_count === "number" ? input.chair_count : null,
    yearsAsPrincipal: typeof input.years_as_principal === "number" ? input.years_as_principal : null,
    focusAreas: input.focus,
    openToPartner: input.open_to_partner === "on",
    openToVisits: input.open_to_visits === "on",
    nudgeOptOut: input.nudge_opt_out === "on",
  };
}

export const completeOnboarding = defineAction({
  schema: particulars,
  run: async (ctx, input) => {
    if (input.focus.length === 0) throw new Error("Choose at least one thing you are working on.");
    await ctx.repo.updateProfile(ctx.userId, { ...toPatch(input), onboarded: true });
    return { redirectTo: "/home" };
  },
});

export const updateParticulars = defineAction({
  schema: particulars,
  run: async (ctx, input) => {
    await ctx.repo.updateProfile(ctx.userId, toPatch(input));
    return { message: "Your particulars are revised." };
  },
});
