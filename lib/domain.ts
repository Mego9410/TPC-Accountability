/**
 * Kept — the model.
 *
 * Two things, and nothing else.
 *
 *  1. A **partner**. You find another principal yourself, ask them, and if
 *     they agree you share what you are working on and each keeps an eye on
 *     whether the other is getting on with it. One ongoing relationship.
 *
 *  2. A **companion visit**. A morning inside another principal's practice —
 *     the workflow, the systems, the processes, the feel of the culture —
 *     and, in turn, a morning inside yours. Twice a year, with any member,
 *     by mutual agreement. You are both host and visitor.
 *
 * Everything is camelCase; storage adapters map to and from their own shapes.
 */

export type MemberRole = "member" | "staff";
export type PracticeType = "NHS" | "Private" | "Mixed";

export interface Profile {
  id: string;
  honorific: string;
  fullName: string;
  email: string | null;
  practiceName: string | null;
  region: string | null;
  practiceType: PracticeType | null;
  chairCount: number | null;
  yearsAsPrincipal: number | null;
  timezone: string;
  /** A short note on the practice, read by anyone deciding whether to ask you. */
  bio: string | null;
  /** What you are working on. Shown when someone is looking for a partner. */
  focusAreas: string[];
  /** Whether you are willing to receive a visitor at present. */
  openToVisits: boolean;
  /** Whether you are looking for a partner at present. */
  openToPartner: boolean;
  membershipNo: string;
  role: MemberRole;
  onboarded: boolean;
  /** The monthly note asking how the goals are getting on. */
  nudgeOptOut: boolean;
  createdAt: string;
}

/* ---------- The partner ---------- */

export type PartnershipStatus = "proposed" | "active" | "declined" | "ended";

export interface Partnership {
  id: string;
  /** The two principals. Order carries no meaning. */
  aId: string;
  bId: string;
  proposedById: string;
  status: PartnershipStatus;
  /** A word with the request: why you asked. */
  message: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export interface PartnershipWithPartner extends Partnership {
  /** The other principal, from the viewer's side. */
  partner: Profile;
}

/* ---------- The goals ---------- */

export type GoalStatus = "open" | "done";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  detail: string | null;
  /** Optional. A goal without a date is still a goal. */
  targetDate: string | null; // yyyy-mm-dd
  status: GoalStatus;
  doneAt: string | null;
  createdAt: string;
}

/**
 * A line written against a goal: your own progress, or a word from your
 * partner. The monthly note asks for one of these.
 */
export interface GoalUpdate {
  id: string;
  goalId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

/* ---------- The visit ---------- */

export type VisitStatus = "proposed" | "agreed" | "declined" | "held" | "cancelled";

export interface Visit {
  id: string;
  /** The principal going. */
  visitorId: string;
  /** The principal opening their practice. */
  hostId: string;
  proposedById: string;
  scheduledAt: string;
  status: VisitStatus;
  /** The host's practice, denormalised for display. */
  practiceName: string | null;
  /** A word with the request: what you hope to see. */
  proposalNote: string | null;
  /** The host's practicalities: where to park, who to ask for, when to arrive. */
  arrivalNote: string | null;
  /** Written afterwards by either of you, and seen by both. */
  notes: string | null;
  createdAt: string;
}

/* ---------- Correspondence ---------- */

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

/* =========================================================================
   Labels and small helpers
   ------------------------------------------------------------------------- */

/** The most visits a member may have in any twelve months. */
export const VISITS_A_YEAR = 2;

export const MEMBER_ROLE_LABEL: Record<MemberRole, string> = {
  member: "Member",
  staff: "The House",
};

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  open: "Open",
  done: "Done",
};

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  proposed: "Proposed",
  agreed: "Agreed",
  declined: "Declined",
  held: "Held",
  cancelled: "Cancelled",
};

export const PARTNERSHIP_STATUS_LABEL: Record<PartnershipStatus, string> = {
  proposed: "Asked",
  active: "Partners",
  declined: "Declined",
  ended: "Ended",
};

/** The other principal in a partnership. */
export function partnerIdOf(p: Partnership, userId: string): string {
  return p.aId === userId ? p.bId : p.aId;
}

export function isParty(p: Partnership, userId: string): boolean {
  return p.aId === userId || p.bId === userId;
}

/** Whether this principal still owes an answer to a request. */
export function awaitingAnswerFrom(
  p: { status: string; proposedById: string },
  userId: string,
): boolean {
  return p.status === "proposed" && p.proposedById !== userId;
}

export function otherPartyOfVisit(v: Visit, userId: string): string {
  return userId === v.visitorId ? v.hostId : v.visitorId;
}

/** Visits held in the last twelve months, against the ceiling of two a year. */
export function visitsThisYear(visits: Visit[], userId: string, now = new Date()): number {
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  return visits.filter(
    (v) =>
      v.status === "held" &&
      (v.visitorId === userId || v.hostId === userId) &&
      new Date(v.scheduledAt) >= yearAgo,
  ).length;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "P";
  const parts = name.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "").trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "P";
}

/** "Dr Cheng" from a profile. */
export function address(profile: Pick<Profile, "fullName" | "honorific">): string {
  const name = profile.fullName?.trim();
  if (!name) return "Principal";
  const parts = name.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "").trim().split(/\s+/);
  const surname = parts[parts.length - 1];
  const honorific = (profile.honorific || "Dr").replace(/\.$/, "");
  return `${honorific} ${surname}`;
}

export function firstName(profile: Pick<Profile, "fullName">): string {
  const name = profile.fullName?.trim();
  if (!name) return "there";
  const parts = name.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, "").trim().split(/\s+/);
  return parts[0] ?? "there";
}

/** "Cheng Dental, Marylebone · London · 4 chairs · Mixed" */
export function practiceLine(p: Profile): string {
  return [
    p.practiceName,
    p.region,
    p.chairCount ? `${p.chairCount} ${p.chairCount === 1 ? "chair" : "chairs"}` : null,
    p.practiceType,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function yearsLine(p: Profile): string | null {
  if (p.yearsAsPrincipal == null) return null;
  if (p.yearsAsPrincipal === 0) return "Not yet a principal";
  if (p.yearsAsPrincipal === 1) return "First year as a principal";
  return `${p.yearsAsPrincipal} years a principal`;
}
