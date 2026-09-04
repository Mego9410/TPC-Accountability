/**
 * The Principals Club — domain model.
 *
 * One model for the whole product. A member belongs to one or more *circles*
 * (a pair or a pod). Inside a circle they are a peer, a mentee, a mentor, or
 * the lead. Every member runs twelve-week *goal blocks* of weekly
 * *commitments*, checks in once a week, logs *wins*, and reports figures to
 * the *benchmark*. Mentors see their mentees' progress and leave *notes*.
 *
 * All types are camelCase; storage adapters map to and from their own shapes.
 */

export type MemberRole = "member" | "mentor" | "staff";
export type Tier = "member" | "society";
export type CircleKind = "pair" | "pod";
export type CircleRole = "peer" | "mentee" | "mentor" | "lead";
export type Cadence = "weekly" | "fortnightly" | "monthly";
export type CommitmentStatus = "open" | "done" | "partial" | "missed" | "carried";
export type BlockStatus = "active" | "completed" | "abandoned";
export type SittingStatus = "scheduled" | "completed" | "cancelled";
/**
 * A sitting is either held over video, or held inside somebody's practice.
 * Every principal visits every other principal in their circle, and in turn
 * has each of them inside their own practice for a morning.
 */
export type PracticeType = "NHS" | "Private" | "Mixed";
export type CircleStatus = "active" | "archived";

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
  bio: string | null;
  membershipNo: string;
  role: MemberRole;
  tier: Tier;
  onboarded: boolean;
  focusAreas: string[];
  cadence: Cadence;
  preferredTimes: string[];
  /** Mentors only: how many mentees they will take, and the note shown to them. */
  mentorCapacity: number | null;
  mentorNote: string | null;
  consistencyScore: number;
  nudgeOptOut: boolean;
  createdAt: string;
}

export interface Circle {
  id: string;
  kind: CircleKind;
  name: string;
  cadence: Cadence;
  cohortLabel: string | null;
  status: CircleStatus;
  createdAt: string;
}

export interface CircleMember {
  circleId: string;
  userId: string;
  role: CircleRole;
  joinedAt: string;
}

export interface CircleWithMembers extends Circle {
  members: Array<CircleMember & { profile: Profile }>;
}

export interface Sitting {
  id: string;
  circleId: string;
  scheduledAt: string;
  status: SittingStatus;
  joinUrl: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

/* ---------- Companion practice visits ----------
   A morning inside another principal's practice, and in turn one inside
   yours. Either party may propose; the other agrees or declines, and may
   decline for any reason without giving one. Both give the confidentiality
   undertaking before it is agreed. What is learned is written down after. */

export type VisitStatus = "proposed" | "agreed" | "declined" | "held" | "cancelled";

export interface Visit {
  id: string;
  circleId: string;
  /** The principal going. */
  visitorId: string;
  /** The principal opening their practice. */
  hostId: string;
  proposedById: string;
  /** The morning itself. */
  scheduledAt: string;
  status: VisitStatus;
  /** The host's practice, denormalised for display. */
  practiceName: string | null;
  /** A word with the proposal: what the visitor hopes to see. */
  proposalNote: string | null;
  /** The host's practicalities: where to park, who to ask for, when to arrive. */
  arrivalNote: string | null;
  /** The confidentiality undertaking, given by each party before it is agreed. */
  visitorAgreedAt: string | null;
  hostAgreedAt: string | null;
  heldAt: string | null;
  createdAt: string;
}

/**
 * The record of a visit, kept in four parts so that it is useful afterwards
 * rather than a single box of prose. Three belong to the visitor and one to
 * the host, because both sides learn something.
 */
export type VisitNoteKind = "observation" | "takeaway" | "for_host" | "host_note";

export interface VisitNote {
  id: string;
  visitId: string;
  authorId: string;
  kind: VisitNoteKind;
  body: string;
  /** Set when a takeaway has been set down as a commitment in a block. */
  commitmentId: string | null;
  createdAt: string;
}

export interface GoalBlock {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  status: BlockStatus;
  templateId: string | null;
  createdAt: string;
}

export interface Commitment {
  id: string;
  blockId: string;
  userId: string;
  week: number; // 1..12
  text: string;
  status: CommitmentStatus;
  carriedFrom: string | null;
  sittingId: string | null;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  circleId: string | null;
  weekKey: string; // "2026-W36"
  blockWeek: number | null;
  didWell: string | null;
  struggledWith: string | null;
  nextFocus: string | null;
  energy: number | null; // 1..10
  completedAt: string;
}

export interface Win {
  id: string;
  userId: string;
  blockId: string | null;
  title: string;
  detail: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  circleId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

/** A mentor's note about a mentee: on a commitment, a check-in, or general. */
export interface Note {
  id: string;
  authorId: string;
  aboutUserId: string;
  commitmentId: string | null;
  checkInId: string | null;
  body: string;
  createdAt: string;
}

export interface BenchmarkEntry {
  id: string;
  userId: string;
  period: string; // yyyy-mm-01
  metricKey: string;
  value: number;
  createdAt: string;
}

export interface CohortStat {
  scope: "cohort" | "club";
  cohortSize: number;
  median: number;
  p25: number;
  p75: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  metricLabel: string; // e.g. "new patients"
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface ChallengeParticipant {
  challengeId: string;
  userId: string;
  progress: number;
  leaderboardOptIn: boolean;
}

export interface LeaderboardRow {
  userId: string | null;
  displayName: string;
  progress: number;
  rank: number;
}

export interface Template {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  audience: "mentee" | "any";
  sort: number;
  weeks: Array<{ week: number; text: string }>;
}

/* ---------- Helpers on the model ---------- */

export const BLOCK_WEEKS = 12;

export const CADENCE_LABEL: Record<Cadence, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
};

export const COMMITMENT_STATUS_LABEL: Record<CommitmentStatus, string> = {
  open: "Open",
  done: "Kept",
  partial: "Partly kept",
  missed: "Missed",
  carried: "Carried forward",
};

export const BLOCK_STATUS_LABEL: Record<BlockStatus, string> = {
  active: "Active",
  completed: "Completed",
  abandoned: "Set aside",
};

export const SITTING_STATUS_LABEL: Record<SittingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Held",
  cancelled: "Cancelled",
};

export const CIRCLE_ROLE_LABEL: Record<CircleRole, string> = {
  peer: "Partner",
  mentee: "Mentee",
  mentor: "Mentor",
  lead: "Pod lead",
};

export const MEMBER_ROLE_LABEL: Record<MemberRole, string> = {
  member: "Member",
  mentor: "Mentor",
  staff: "The House",
};

export const TIER_LABEL: Record<Tier, string> = {
  member: "Member",
  society: "Society",
};

export function isMentorIn(circle: CircleWithMembers, userId: string): boolean {
  return circle.members.some(
    (m) => m.userId === userId && (m.role === "mentor" || m.role === "lead"),
  );
}

export function circleRoleOf(circle: CircleWithMembers, userId: string): CircleRole | null {
  return circle.members.find((m) => m.userId === userId)?.role ?? null;
}

export function othersIn(circle: CircleWithMembers, userId: string) {
  return circle.members.filter((m) => m.userId !== userId);
}

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  proposed: "Proposed",
  agreed: "Agreed",
  declined: "Declined",
  held: "Held",
  cancelled: "Cancelled",
};

export const VISIT_NOTE_LABEL: Record<VisitNoteKind, string> = {
  observation: "What I saw",
  takeaway: "What I am taking back",
  for_host: "What struck me, for the host",
  host_note: "What I took from being asked",
};

export const VISIT_NOTE_HELP: Record<VisitNoteKind, string> = {
  observation: "The systems, the diary, the team. Written while it is fresh.",
  takeaway: "The thing you will actually do at home. Each one can be set down as a commitment.",
  for_host: "What a stranger noticed in a morning. Say it plainly; it is the reason they opened the door.",
  host_note: "You learn as much showing someone your practice as you do walking round theirs.",
};

/** Which note kinds a given principal may add to a visit. */
export function noteKindsFor(visit: Visit, userId: string): VisitNoteKind[] {
  if (userId === visit.visitorId) return ["observation", "takeaway", "for_host"];
  if (userId === visit.hostId) return ["host_note"];
  return [];
}

/** A visit is settled once both parties have given the undertaking. */
export function undertakingGiven(visit: Visit): boolean {
  return Boolean(visit.visitorAgreedAt && visit.hostAgreedAt);
}

/** The counterparty: whoever is not the viewer. */
export function otherPartyId(visit: Visit, userId: string): string {
  return userId === visit.visitorId ? visit.hostId : visit.visitorId;
}

/** Whether this principal still owes a response to a proposal. */
export function awaitingResponseFrom(visit: Visit, userId: string): boolean {
  return visit.status === "proposed" && visit.proposedById !== userId
    && (userId === visit.visitorId || userId === visit.hostId);
}

export interface VisitLedger {
  /** Members whose practice the viewer has not yet been inside. */
  toVisit: Profile[];
  /** Members who have not yet been inside the viewer's practice. */
  toHost: Profile[];
  visited: Array<{ profile: Profile; at: string; visitId: string }>;
  hosted: Array<{ profile: Profile; at: string; visitId: string }>;
}

/**
 * Who in this circle the viewer has yet to be inside, and who has yet to be
 * inside theirs. Only held visits count, and where a practice has been seen
 * more than once the most recent morning is the one on the ledger.
 */
export function visitLedger(
  circle: CircleWithMembers,
  visits: Visit[],
  userId: string,
): VisitLedger {
  const held = visits.filter((v) => v.circleId === circle.id && v.status === "held");
  const latest = (visitorId: string, hostId: string) =>
    held
      .filter((v) => v.visitorId === visitorId && v.hostId === hostId)
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0] ?? null;

  const ledger: VisitLedger = { toVisit: [], toHost: [], visited: [], hosted: [] };
  for (const profile of othersIn(circle, userId).map((m) => m.profile)) {
    const iWent = latest(userId, profile.id);
    if (iWent) ledger.visited.push({ profile, at: iWent.scheduledAt, visitId: iWent.id });
    else ledger.toVisit.push(profile);

    const theyCame = latest(profile.id, userId);
    if (theyCame) ledger.hosted.push({ profile, at: theyCame.scheduledAt, visitId: theyCame.id });
    else ledger.toHost.push(profile);
  }
  return ledger;
}

/** The mentees a mentor is responsible for, across all their circles. */
export function menteesOf(circles: CircleWithMembers[], mentorId: string): Profile[] {
  const seen = new Map<string, Profile>();
  for (const c of circles) {
    if (!isMentorIn(c, mentorId)) continue;
    for (const m of c.members) {
      if (m.userId !== mentorId && (m.role === "mentee" || (c.kind === "pod" && m.role !== "mentor"))) {
        seen.set(m.userId, m.profile);
      }
    }
  }
  return [...seen.values()];
}

/** The mentor a mentee reports to, if any. */
export function mentorOf(circles: CircleWithMembers[], menteeId: string): Profile | null {
  for (const c of circles) {
    if (c.kind !== "pair") continue;
    const me = c.members.find((m) => m.userId === menteeId);
    if (me?.role !== "mentee") continue;
    const mentor = c.members.find((m) => m.role === "mentor");
    if (mentor) return mentor.profile;
  }
  return null;
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
