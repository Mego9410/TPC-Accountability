"use server";

import { z } from "zod";
import { defineAction, zList, zOptText, zText } from "./define";
import { HONORIFICS, TIMEZONES } from "@/lib/options";
import { PRACTICE_TYPES, REGIONS } from "@/lib/benchmarks";

const practice = z.object({
  practice_name: zOptText(120),
  region: z.enum(REGIONS as [string, ...string[]]).optional().or(z.literal("")),
  practice_type: z.enum(PRACTICE_TYPES).optional().or(z.literal("")),
  chair_count: z.union([z.coerce.number().int().min(1).max(60), z.literal("")]).optional(),
  years_as_principal: z.union([z.coerce.number().int().min(0).max(60), z.literal("")]).optional(),
});

/** The onboarding form: who you are, what you run, what you want from the Club. */
export const completeOnboarding = defineAction({
  schema: z
    .object({
      honorific: z.enum(HONORIFICS as [string, ...string[]]).default("Dr"),
      full_name: zText("Your name", 80),
      timezone: z.enum(TIMEZONES as [string, ...string[]]).default("Europe/London"),
      bio: zOptText(400),
      wants: z.enum(["mentee", "peer", "mentor"], { message: "Choose how you would like to take part." }),
      focus: zList,
      cadence: z.enum(["weekly", "fortnightly", "monthly"]).default("fortnightly"),
      times: zList,
      mentor_capacity: z.union([z.coerce.number().int().min(1).max(6), z.literal("")]).optional(),
      mentor_note: zOptText(400),
    })
    .and(practice),
  run: async (ctx, input) => {
    if (input.focus.length === 0) throw new Error("Choose at least one focus.");
    const wantsMentor = input.wants === "mentor";
    await ctx.repo.updateProfile(ctx.userId, {
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
      cadence: input.cadence,
      preferredTimes: input.times,
      role: wantsMentor ? "mentor" : ctx.profile.role === "staff" ? "staff" : "member",
      mentorCapacity: wantsMentor && typeof input.mentor_capacity === "number" ? input.mentor_capacity : null,
      mentorNote: wantsMentor ? input.mentor_note : null,
      onboarded: true,
    });
    return { redirectTo: "/home" };
  },
});

export const updateParticulars = defineAction({
  schema: z
    .object({
      honorific: z.enum(HONORIFICS as [string, ...string[]]),
      full_name: zText("Your name", 80),
      timezone: z.enum(TIMEZONES as [string, ...string[]]),
      bio: zOptText(400),
      focus: zList,
      cadence: z.enum(["weekly", "fortnightly", "monthly"]),
      times: zList,
      nudge_opt_out: z.string().optional(),
      mentor_capacity: z.union([z.coerce.number().int().min(1).max(6), z.literal("")]).optional(),
      mentor_note: zOptText(400),
    })
    .and(practice),
  run: async (ctx, input) => {
    await ctx.repo.updateProfile(ctx.userId, {
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
      cadence: input.cadence,
      preferredTimes: input.times,
      nudgeOptOut: input.nudge_opt_out === "on",
      ...(ctx.profile.role === "mentor"
        ? {
            mentorCapacity: typeof input.mentor_capacity === "number" ? input.mentor_capacity : ctx.profile.mentorCapacity,
            mentorNote: input.mentor_note,
          }
        : {}),
    });
    return { message: "Your particulars are revised." };
  },
});

/**
 * Membership. In the furnished example this simply changes the tier; when the
 * Club is connected the same action is where Stripe Checkout begins.
 */
export const changeTier = defineAction({
  schema: z.object({ tier: z.enum(["member", "society"]) }),
  run: async (ctx, input) => {
    await ctx.repo.updateProfile(ctx.userId, { tier: input.tier });
    return {
      message: input.tier === "society" ? "Welcome to the Society." : "You are now a Member. The Society will keep your record.",
      redirectTo: input.tier === "society" ? "/home?welcome=society" : "/settings",
    };
  },
});
