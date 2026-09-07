"use server";

import { z } from "zod";
import { defineAction, zOptText } from "./define";
import { VISITS_A_YEAR, visitsThisYear, type Visit } from "@/lib/domain";
import type { Viewer } from "@/lib/session";

/* =========================================================================
   Companion visits. A morning inside another principal's practice, and in
   turn one inside yours. Either may propose; the other agrees or declines,
   and may decline without giving a reason. Two a year is the ceiling.
   ------------------------------------------------------------------------- */

async function ownVisit(ctx: Viewer, visitId: string): Promise<Visit> {
  const visit = await ctx.repo.getVisit(visitId);
  if (!visit) throw new Error("No such visit.");
  if (visit.visitorId !== ctx.userId && visit.hostId !== ctx.userId) {
    throw new Error("That visit is not yours.");
  }
  return visit;
}

function futureDate(value: string): string {
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) throw new Error("That date could not be read.");
  if (when.getTime() < Date.now() - 60_000) throw new Error("Pick a morning in the future.");
  return when.toISOString();
}

export const proposeVisit = defineAction({
  schema: z.object({
    /** The principal whose practice is opened. */
    host_id: z.string().min(1, "Choose whose practice."),
    /** The principal going. Defaults to whoever is asking. */
    visitor_id: z.string().optional(),
    scheduled_at: z.string().min(10, "Pick a morning."),
    proposal_note: zOptText(600),
  }),
  run: async (ctx, input) => {
    const visitorId = input.visitor_id || ctx.userId;
    if (visitorId === input.host_id) throw new Error("A principal cannot visit their own practice.");
    if (ctx.userId !== visitorId && ctx.userId !== input.host_id) {
      throw new Error("You may only arrange a visit you are part of.");
    }
    const [host, visitor] = await Promise.all([
      ctx.repo.getProfile(input.host_id),
      ctx.repo.getProfile(visitorId),
    ]);
    if (!host || !visitor || host.role === "staff" || visitor.role === "staff") {
      throw new Error("No such member.");
    }
    if (!host.openToVisits) throw new Error(`${host.fullName} is not receiving visitors at present.`);

    const mine = await ctx.repo.listVisitsFor(ctx.userId);
    if (visitsThisYear(mine, ctx.userId) >= VISITS_A_YEAR) {
      throw new Error(`Two visits a year is the ceiling, and you have had yours. It resets twelve months after the first.`);
    }
    if (mine.some((v) => (v.status === "proposed" || v.status === "agreed") && (v.hostId === host.id || v.visitorId === host.id))) {
      throw new Error("You already have a morning in hand with that principal.");
    }

    const visit = await ctx.repo.createVisit({
      visitorId,
      hostId: host.id,
      proposedById: ctx.userId,
      scheduledAt: futureDate(input.scheduled_at),
      practiceName: host.practiceName?.trim() || host.fullName,
      proposalNote: input.proposal_note,
    });
    return {
      message: ctx.userId === visitorId ? "Asked. They may accept or decline." : "Offered. They may accept or decline.",
      redirectTo: `/visits/${visit.id}`,
    };
  },
});

export const answerVisit = defineAction({
  schema: z.object({ visit_id: z.string(), answer: z.enum(["agree", "decline"]) }),
  run: async (ctx, input) => {
    const visit = await ownVisit(ctx, input.visit_id);
    if (visit.status !== "proposed") throw new Error("That visit has already been answered.");
    if (visit.proposedById === ctx.userId) throw new Error("You proposed this morning; it is for them to answer.");

    if (input.answer === "decline") {
      await ctx.repo.updateVisit(visit.id, { status: "declined" });
      return { message: "Declined. No reason is owed, and none is recorded." };
    }
    await ctx.repo.updateVisit(visit.id, { status: "agreed" });
    return { message: "Agreed. It is in both your diaries." };
  },
});

/**
 * A patch, not a whole record: a field absent from the form is left alone.
 * `zOptText` turns an absent field into `null`, which would make every one of
 * these branches fire on every submission, so the patch fields stay plain
 * optional strings and are narrowed to null only when they are actually sent.
 */
const zPatchText = (max: number) => z.string().trim().max(max, "Too long.").optional();

export const updateVisitDetails = defineAction({
  schema: z.object({
    visit_id: z.string(),
    scheduled_at: z.string().optional(),
    arrival_note: zPatchText(800),
    notes: zPatchText(4000),
  }),
  run: async (ctx, input) => {
    const visit = await ownVisit(ctx, input.visit_id);
    const patch: Partial<Visit> = {};

    if (input.scheduled_at) {
      if (visit.status !== "proposed" && visit.status !== "agreed") {
        throw new Error("Only a morning still to come can be moved.");
      }
      patch.scheduledAt = futureDate(input.scheduled_at);
    }
    if (input.arrival_note !== undefined) {
      if (visit.hostId !== ctx.userId) throw new Error("Only the host sets the practicalities.");
      patch.arrivalNote = input.arrival_note || null;
    }
    if (input.notes !== undefined) {
      if (visit.status !== "held") throw new Error("The notes open once the morning is held.");
      patch.notes = input.notes || null;
    }
    if (Object.keys(patch).length === 0) return { message: "Nothing to save." };
    await ctx.repo.updateVisit(visit.id, patch);
    return { message: "Saved." };
  },
});

export const markVisitHeld = defineAction({
  schema: z.object({ visit_id: z.string() }),
  run: async (ctx, input) => {
    const visit = await ownVisit(ctx, input.visit_id);
    if (visit.status !== "agreed") throw new Error("Only an agreed morning can be recorded as held.");
    if (new Date(visit.scheduledAt).getTime() > Date.now()) throw new Error("The morning has not happened yet.");
    await ctx.repo.updateVisit(visit.id, { status: "held" });
    return { message: "Recorded as held. Write down what struck you while it is fresh." };
  },
});

export const cancelVisit = defineAction({
  schema: z.object({ visit_id: z.string() }),
  run: async (ctx, input) => {
    const visit = await ownVisit(ctx, input.visit_id);
    if (visit.status === "held") throw new Error("A morning already held cannot be cancelled.");
    await ctx.repo.updateVisit(visit.id, { status: "cancelled" });
    return { message: "Cancelled. A difficult week is reason enough." };
  },
});
