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
