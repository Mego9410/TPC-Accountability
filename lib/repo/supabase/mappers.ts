import type {
  BenchmarkEntry,
  Challenge,
  ChallengeParticipant,
  CheckIn,
  Circle,
  CircleMember,
  Commitment,
  GoalBlock,
  LeaderboardRow,
  Message,
  Note,
  Profile,
  Sitting,
  Template,
  Win,
} from "@/lib/domain";
import type {
  BenchmarkEntryRow,
  ChallengeParticipantRow,
  ChallengeRow,
  CheckInRow,
  CircleMemberRow,
  CircleRow,
  CommitmentRow,
  GoalBlockRow,
  LeaderboardRpcRow,
  MessageRow,
  NoteRow,
  ProfileRow,
  SittingRow,
  TemplateRow,
  TemplateWeekRow,
  WinRow,
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
    membershipNo: r.membership_no,
    role: r.role,
    tier: r.tier,
    onboarded: r.onboarded,
    focusAreas: r.focus_areas ?? [],
    cadence: r.cadence,
    preferredTimes: r.preferred_times ?? [],
    mentorCapacity: r.mentor_capacity,
    mentorNote: r.mentor_note,
    consistencyScore: Number(r.consistency_score),
    nudgeOptOut: r.nudge_opt_out,
    createdAt: r.created_at,
  };
}

export function toCircle(r: CircleRow): Circle {
  return {
    id: r.id,
    kind: r.kind,
    name: r.name,
    cadence: r.cadence,
    cohortLabel: r.cohort_label,
    status: r.status,
    createdAt: r.created_at,
  };
}

export function toCircleMember(r: CircleMemberRow): CircleMember {
  return { circleId: r.circle_id, userId: r.user_id, role: r.role, joinedAt: r.joined_at };
}

export function toSitting(r: SittingRow): Sitting {
  return {
    id: r.id,
    circleId: r.circle_id,
    scheduledAt: r.scheduled_at,
    status: r.status,
    joinUrl: r.join_url,
    notes: r.notes,
    createdBy: r.created_by,
    createdAt: r.created_at,
    kind: r.kind,
    hostId: r.host_id,
    location: r.location,
  };
}

export function toBlock(r: GoalBlockRow): GoalBlock {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    templateId: r.template_id,
    createdAt: r.created_at,
  };
}

export function toCommitment(r: CommitmentRow): Commitment {
  return {
    id: r.id,
    blockId: r.block_id,
    userId: r.user_id,
    week: r.week,
    text: r.body,
    status: r.status,
    carriedFrom: r.carried_from,
    sittingId: r.sitting_id,
    createdAt: r.created_at,
  };
}

export function toCheckIn(r: CheckInRow): CheckIn {
  return {
    id: r.id,
    userId: r.user_id,
    circleId: r.circle_id,
    weekKey: r.week_key,
    blockWeek: r.block_week,
    didWell: r.did_well,
    struggledWith: r.struggled_with,
    nextFocus: r.next_focus,
    energy: r.energy,
    completedAt: r.completed_at,
  };
}

export function toWin(r: WinRow): Win {
  return {
    id: r.id,
    userId: r.user_id,
    blockId: r.block_id,
    title: r.title,
    detail: r.detail,
    archivedAt: r.archived_at,
    createdAt: r.created_at,
  };
}

export function toMessage(r: MessageRow): Message {
  return {
    id: r.id,
    circleId: r.circle_id,
    senderId: r.sender_id,
    body: r.body,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

export function toNote(r: NoteRow): Note {
  return {
    id: r.id,
    authorId: r.author_id,
    aboutUserId: r.about_user_id,
    commitmentId: r.commitment_id,
    checkInId: r.check_in_id,
    body: r.body,
    createdAt: r.created_at,
  };
}

export function toBenchmarkEntry(r: BenchmarkEntryRow): BenchmarkEntry {
  return {
    id: r.id,
    userId: r.user_id,
    period: r.period,
    metricKey: r.metric_key,
    value: Number(r.value),
    createdAt: r.created_at,
  };
}

export function toChallenge(r: ChallengeRow): Challenge {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    metricLabel: r.metric_label,
    startDate: r.start_date,
    endDate: r.end_date,
    createdAt: r.created_at,
  };
}

export function toParticipant(r: ChallengeParticipantRow): ChallengeParticipant {
  return {
    challengeId: r.challenge_id,
    userId: r.user_id,
    progress: Number(r.progress),
    leaderboardOptIn: r.leaderboard_opt_in,
  };
}

export function toLeaderboardRow(r: LeaderboardRpcRow): LeaderboardRow {
  return { userId: r.user_id, displayName: r.display_name, progress: Number(r.progress), rank: r.rank };
}

export function toTemplate(r: TemplateRow, weeks: TemplateWeekRow[]): Template {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    audience: r.audience,
    sort: r.sort,
    weeks: weeks
      .filter((w) => w.template_id === r.id)
      .sort((a, b) => a.week - b.week || a.sort - b.sort)
      .map((w) => ({ week: w.week, text: w.body })),
  };
}

/* ---------- domain patches -> row patches ---------- */

type ColumnMap<D, R> = { [K in keyof D]: keyof R };

/**
 * Turn a partial domain object into a partial row. Values are carried across
 * untouched: every domain field and its column share a type by construction
 * (the row types above are written to match), so only the names change.
 */
export function patchRow<D extends object, R extends object>(patch: Partial<D>, cols: ColumnMap<D, R>): Partial<R> {
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
  membershipNo: "membership_no",
  role: "role",
  tier: "tier",
  onboarded: "onboarded",
  focusAreas: "focus_areas",
  cadence: "cadence",
  preferredTimes: "preferred_times",
  mentorCapacity: "mentor_capacity",
  mentorNote: "mentor_note",
  consistencyScore: "consistency_score",
  nudgeOptOut: "nudge_opt_out",
  createdAt: "created_at",
};

export const sittingCols: ColumnMap<Sitting, SittingRow> = {
  id: "id",
  circleId: "circle_id",
  scheduledAt: "scheduled_at",
  status: "status",
  joinUrl: "join_url",
  notes: "notes",
  createdBy: "created_by",
  createdAt: "created_at",
  kind: "kind",
  hostId: "host_id",
  location: "location",
};

export const blockCols: ColumnMap<GoalBlock, GoalBlockRow> = {
  id: "id",
  userId: "user_id",
  title: "title",
  description: "description",
  startDate: "start_date",
  endDate: "end_date",
  status: "status",
  templateId: "template_id",
  createdAt: "created_at",
};

export const commitmentCols: ColumnMap<Commitment, CommitmentRow> = {
  id: "id",
  blockId: "block_id",
  userId: "user_id",
  week: "week",
  text: "body",
  status: "status",
  carriedFrom: "carried_from",
  sittingId: "sitting_id",
  createdAt: "created_at",
};

export const checkInCols: ColumnMap<CheckIn, CheckInRow> = {
  id: "id",
  userId: "user_id",
  circleId: "circle_id",
  weekKey: "week_key",
  blockWeek: "block_week",
  didWell: "did_well",
  struggledWith: "struggled_with",
  nextFocus: "next_focus",
  energy: "energy",
  completedAt: "completed_at",
};

export const winCols: ColumnMap<Win, WinRow> = {
  id: "id",
  userId: "user_id",
  blockId: "block_id",
  title: "title",
  detail: "detail",
  archivedAt: "archived_at",
  createdAt: "created_at",
};
