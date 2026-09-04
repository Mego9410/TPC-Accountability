"use server";

import { z } from "zod";
import { defineAction, zOptText, zText } from "./define";
import { noteKindsFor, type Visit, type VisitNoteKind } from "@/lib/domain";
import { clampWeek, currentBlockWeek } from "@/lib/weeks";
import type { Viewer } from "@/lib/session";

/* =========================================================================
   Companion practice visits. Either principal may propose a morning; the
   other agrees or declines, and may decline without giving a reason. Both
   give the confidentiality undertaking before it is agreed. Afterwards each
   side writes down what they learned, and the visitor may set a takeaway
   down as a commitment in their block.
   ------------------------------------------------------------------------- */

/** The visit, plus the assurance that the viewer is one of its two parties. */
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
    circle_id: z.string(),
    /** The principal whose practice is opened. */
    host_id: z.string().min(1, "Choose whose practice is being visited."),
    /** The principal going. Defaults to the proposer. */
    visitor_id: z.string().optional(),
    scheduled_at: z.string().min(10, "Pick a morning."),
    proposal_note: zOptText(600),
    undertaking: z.string().optional(),
  }),
  run: async (ctx, input) => {
    const circle = (await ctx.repo.listCirclesFor(ctx.userId)).find((c) => c.id === input.circle_id);
    if (!circle) throw new Error("You are not in that circle.");

    const visitorId = input.visitor_id || ctx.userId;
    if (visitorId === input.host_id) throw new Error("A principal cannot visit their own practice.");
    if (ctx.userId !== visitorId && ctx.userId !== input.host_id) {
      throw new Error("You may only arrange a visit you are part of.");
    }
    const host = circle.members.find((m) => m.userId === input.host_id);
    const visitor = circle.members.find((m) => m.userId === visitorId);
    if (!host || !visitor) throw new Error("Both principals must sit in the same circle.");
    if (!input.undertaking) throw new Error("Give the confidentiality undertaking to propose a morning.");

    const when = futureDate(input.scheduled_at);
    const clash = (await ctx.repo.listVisits([circle.id])).find(
      (v) => v.hostId === host.userId && v.visitorId === visitorId && (v.status === "proposed" || v.status === "agreed"),
    );
    if (clash) throw new Error("That morning is already in hand. Open it rather than proposing another.");

    const now = new Date().toISOString();
    const visit = await ctx.repo.createVisit({
      circleId: circle.id,
      visitorId,
      hostId: host.userId,
      proposedById: ctx.userId,
      scheduledAt: when,
      practiceName: host.profile.practiceName?.trim() || host.profile.fullName,
      proposalNote: input.proposal_note,
    });
    // The proposer gives their undertaking there and then.
    await ctx.repo.updateVisit(visit.id, ctx.userId === visitorId ? { visitorAgreedAt: now } : { hostAgreedAt: now });

    return {
      message: ctx.userId === visitorId ? "Asked. They may accept or decline." : "Offered. They may accept or decline.",
      redirectTo: `/visits/${visit.id}`,
    };
  },
});

export const respondToVisit = defineAction({
  schema: z.object({
    visit_id: z.string(),
    response: z.enum(["agree", "decline"]),
    undertaking: z.string().optional(),
  }),
  run: async (ctx, input) => {
    const visit = await ownVisit(ctx, input.visit_id);
    if (visit.status !== "proposed") throw new Error("That visit has already been answered.");
    if (visit.proposedById === ctx.userId) throw new Error("You proposed this morning; it is for the other to answer.");

    if (input.response === "decline") {
      await ctx.repo.updateVisit(visit.id, { status: "declined" });
      return { message: "Declined. No reason is owed, and none is recorded." };
    }
    if (!input.undertaking) throw new Error("Give the confidentiality undertaking to agree the morning.");

    const now = new Date().toISOString();
    await ctx.repo.updateVisit(visit.id, {
      status: "agreed",
      ...(ctx.userId === visit.visitorId ? { visitorAgreedAt: now } : { hostAgreedAt: now }),
    });
    return { message: "Agreed. It is in both your diaries." };
  },
});

export const rescheduleVisit = defineAction({
  schema: z.object({ visit_id: z.string(), scheduled_at: z.string().min(10, "Pick a morning.") }),
  run: async (ctx, input) => {
    const visit = await ownVisit(ctx, input.visit_id);
    if (visit.status !== "proposed" && visit.status !== "agreed") {
      throw new Error("Only a morning still to come can be moved.");
    }
    await ctx.repo.updateVisit(visit.id, { scheduledAt: futureDate(input.scheduled_at) });
    return { message: "Moved. The other party can see the new morning." };
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

export const setArrivalNote = defineAction({
  schema: z.object({ visit_id: z.string(), arrival_note: zOptText(800) }),
  run: async (ctx, input) => {
    const visit = await ownVisit(ctx, input.visit_id);
    if (visit.hostId !== ctx.userId) throw new Error("Only the host sets the practicalities.");
    await ctx.repo.updateVisit(visit.id, { arrivalNote: input.arrival_note });
    return { message: "Saved. Your visitor can see it." };
  },
});

export const markVisitHeld = defineAction({
  schema: z.object({ visit_id: z.string() }),
  run: async (ctx, input) => {
    const visit = await ownVisit(ctx, input.visit_id);
    if (visit.status !== "agreed") throw new Error("Only an agreed morning can be recorded as held.");
    if (new Date(visit.scheduledAt).getTime() > Date.now()) throw new Error("The morning has not happened yet.");
    await ctx.repo.updateVisit(visit.id, { status: "held", heldAt: new Date().toISOString() });
    return { message: "Recorded as held. Write it up while it is fresh." };
  },
});

export const addVisitNote = defineAction({
  schema: z.object({
    visit_id: z.string(),
    kind: z.enum(["observation", "takeaway", "for_host", "host_note"]),
    body: zText("The note", 1000),
  }),
  run: async (ctx, input) => {
    const visit = await ownVisit(ctx, input.visit_id);
    if (visit.status !== "held") throw new Error("The record opens once the morning is held.");
    const allowed = noteKindsFor(visit, ctx.userId);
    if (!allowed.includes(input.kind as VisitNoteKind)) throw new Error("That part of the record is not yours to write.");
    await ctx.repo.createVisitNote({ visitId: visit.id, authorId: ctx.userId, kind: input.kind, body: input.body });
    return { message: "Written down." };
  },
});

export const removeVisitNote = defineAction({
  schema: z.object({ visit_id: z.string(), note_id: z.string() }),
  run: async (ctx, input) => {
    await ownVisit(ctx, input.visit_id);
    const note = (await ctx.repo.listVisitNotes([input.visit_id])).find((n) => n.id === input.note_id);
    if (!note) throw new Error("No such note.");
    if (note.authorId !== ctx.userId) throw new Error("Only the author may remove a note.");
    await ctx.repo.deleteVisitNote(note.id);
    return { message: "Removed." };
  },
});

/**
 * The loop closing: a thing you saw in someone else's practice becomes a
 * commitment in your own block, in the week you are in.
 */
export const setDownTakeaway = defineAction({
  schema: z.object({ visit_id: z.string(), note_id: z.string() }),
  run: async (ctx, input) => {
    await ownVisit(ctx, input.visit_id);
    const note = (await ctx.repo.listVisitNotes([input.visit_id])).find((n) => n.id === input.note_id);
    if (!note) throw new Error("No such note.");
    if (note.authorId !== ctx.userId) throw new Error("That takeaway is not yours.");
    if (note.kind !== "takeaway") throw new Error("Only a takeaway can be set down as a commitment.");
    if (note.commitmentId) throw new Error("That is already set down in your block.");

    const block = (await ctx.repo.listBlocks(ctx.userId)).find((b) => b.status === "active");
    if (!block) throw new Error("You have no block running. Start one and it can be set down there.");

    const commitment = await ctx.repo.createCommitment({
      blockId: block.id,
      userId: ctx.userId,
      week: clampWeek(currentBlockWeek(block)),
      text: note.body,
    });
    await ctx.repo.updateVisitNote(note.id, { commitmentId: commitment.id });
    return { message: `Set down in week ${commitment.week} of “${block.title}”.` };
  },
});
