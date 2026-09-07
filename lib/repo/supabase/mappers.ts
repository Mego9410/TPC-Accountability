import type { Goal, GoalUpdate, Message, Partnership, Profile, Visit } from "@/lib/domain";
import type {
  GoalRow,
  GoalUpdateRow,
  MessageRow,
  PartnershipRow,
  ProfileRow,
  VisitRow,
} from "./database.types";

/**
 * Where snake_case rows meet the camelCase domain. Each `to*` reads a row;
 * each `*Cols` names the column behind every domain field so a partial patch
 * can be turned into a partial row without listing the fields twice.
 */

/* ---------- rows -> domain ---------- */

export function toProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    honorific: r.honorific,
    fullName: r.full_name,
    email: r.email,
    practiceName: r.practice_name,
    region: r.region,
    practiceType: r.practice_type,
    chairCount: r.chair_count,
    yearsAsPrincipal: r.years_as_principal,
    timezone: r.timezone,
    bio: r.bio,
    focusAreas: r.focus_areas ?? [],
    openToVisits: r.open_to_visits,
    openToPartner: r.open_to_partner,
    membershipNo: r.membership_no,
    role: r.role,
    onboarded: r.onboarded,
    nudgeOptOut: r.nudge_opt_out,
    createdAt: r.created_at,
  };
}

export function toPartnership(r: PartnershipRow): Partnership {
  return {
    id: r.id,
    aId: r.a_id,
    bId: r.b_id,
    proposedById: r.proposed_by_id,
    status: r.status,
    message: r.message,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    createdAt: r.created_at,
  };
}

export function toGoal(r: GoalRow): Goal {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    detail: r.detail,
    targetDate: r.target_date,
    status: r.status,
    doneAt: r.done_at,
    createdAt: r.created_at,
  };
}

export function toGoalUpdate(r: GoalUpdateRow): GoalUpdate {
  return {
    id: r.id,
    goalId: r.goal_id,
    authorId: r.author_id,
    body: r.body,
    createdAt: r.created_at,
  };
}

export function toVisit(r: VisitRow): Visit {
  return {
    id: r.id,
    visitorId: r.visitor_id,
    hostId: r.host_id,
    proposedById: r.proposed_by_id,
    scheduledAt: r.scheduled_at,
    status: r.status,
    practiceName: r.practice_name,
    proposalNote: r.proposal_note,
    arrivalNote: r.arrival_note,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export function toMessage(r: MessageRow): Message {
  return {
    id: r.id,
    fromId: r.from_id,
    toId: r.to_id,
    body: r.body,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

/* ---------- domain patches -> row patches ---------- */

type ColumnMap<D, R> = { [K in keyof D]: keyof R };

/**
 * Turn a partial domain object into a partial row. Values are carried across
 * untouched: every domain field and its column share a type by construction
 * (the row types are written to match), so only the names change.
 */
export function patchRow<D extends object, R extends object>(
  patch: Partial<D>,
  cols: ColumnMap<D, R>,
): Partial<R> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(patch) as Array<keyof D>) {
    const value = patch[key];
    if (value === undefined) continue;
    const col = cols[key];
    if (col === undefined) continue;
    out[String(col)] = value;
  }
  return out as Partial<R>;
}

export const profileCols: ColumnMap<Profile, ProfileRow> = {
  id: "id",
  honorific: "honorific",
  fullName: "full_name",
  email: "email",
  practiceName: "practice_name",
  region: "region",
  practiceType: "practice_type",
  chairCount: "chair_count",
  yearsAsPrincipal: "years_as_principal",
  timezone: "timezone",
  bio: "bio",
  focusAreas: "focus_areas",
  openToVisits: "open_to_visits",
  openToPartner: "open_to_partner",
  membershipNo: "membership_no",
  role: "role",
  onboarded: "onboarded",
  nudgeOptOut: "nudge_opt_out",
  createdAt: "created_at",
};

export const partnershipCols: ColumnMap<Partnership, PartnershipRow> = {
  id: "id",
  aId: "a_id",
  bId: "b_id",
  proposedById: "proposed_by_id",
  status: "status",
  message: "message",
  startedAt: "started_at",
  endedAt: "ended_at",
  createdAt: "created_at",
};

export const goalCols: ColumnMap<Goal, GoalRow> = {
  id: "id",
  userId: "user_id",
  title: "title",
  detail: "detail",
  targetDate: "target_date",
  status: "status",
  doneAt: "done_at",
  createdAt: "created_at",
};

export const goalUpdateCols: ColumnMap<GoalUpdate, GoalUpdateRow> = {
  id: "id",
  goalId: "goal_id",
  authorId: "author_id",
  body: "body",
  createdAt: "created_at",
};

export const visitCols: ColumnMap<Visit, VisitRow> = {
  id: "id",
  visitorId: "visitor_id",
  hostId: "host_id",
  proposedById: "proposed_by_id",
  scheduledAt: "scheduled_at",
  status: "status",
  practiceName: "practice_name",
  proposalNote: "proposal_note",
  arrivalNote: "arrival_note",
  notes: "notes",
  createdAt: "created_at",
};

export const messageCols: ColumnMap<Message, MessageRow> = {
  id: "id",
  fromId: "from_id",
  toId: "to_id",
  body: "body",
  readAt: "read_at",
  createdAt: "created_at",
};
