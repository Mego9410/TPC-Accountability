/**
 * The shape of the Postgres schema in supabase/migrations, written by hand so
 * the client is typed end to end. Keep it in step with 0001_schema.sql and
 * 0003_functions.sql; the mappers in ./mappers.ts are the only place these
 * snake_case rows meet the camelCase domain.
 */

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/* ---------- rows ---------- */

export type RegionRow = {
  name: string;
};

export type ProfileRow = {
  id: string;
  honorific: string;
  full_name: string;
  email: string | null;
  practice_name: string | null;
  region: string | null;
  practice_type: "NHS" | "Private" | "Mixed" | null;
  chair_count: number | null;
  years_as_principal: number | null;
  timezone: string;
  bio: string | null;
  membership_no: string;
  role: "member" | "mentor" | "staff";
  tier: "member" | "society";
  onboarded: boolean;
  focus_areas: string[];
  cadence: "weekly" | "fortnightly" | "monthly";
  preferred_times: string[];
  mentor_capacity: number | null;
  mentor_note: string | null;
  consistency_score: number;
  nudge_opt_out: boolean;
  created_at: string;
  updated_at: string;
};

export type CircleRow = {
  id: string;
  kind: "pair" | "pod";
  name: string;
  cadence: "weekly" | "fortnightly" | "monthly";
  cohort_label: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

export type CircleMemberRow = {
  circle_id: string;
  user_id: string;
  role: "peer" | "mentee" | "mentor" | "lead";
  joined_at: string;
  left_at: string | null;
};

export type SittingRow = {
  id: string;
  circle_id: string;
  scheduled_at: string;
  status: "scheduled" | "completed" | "cancelled";
  join_url: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type GoalBlockRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "abandoned";
  template_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CommitmentRow = {
  id: string;
  block_id: string;
  user_id: string;
  week: number;
  body: string;
  status: "open" | "done" | "partial" | "missed" | "carried";
  carried_from: string | null;
  sitting_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CheckInRow = {
  id: string;
  user_id: string;
  circle_id: string | null;
  week_key: string;
  block_week: number | null;
  did_well: string | null;
  struggled_with: string | null;
  next_focus: string | null;
  energy: number | null;
  completed_at: string;
  updated_at: string;
};

export type WinRow = {
  id: string;
  user_id: string;
  block_id: string | null;
  title: string;
  detail: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  circle_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteRow = {
  id: string;
  author_id: string;
  about_user_id: string;
  commitment_id: string | null;
  check_in_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type BenchmarkEntryRow = {
  id: string;
  user_id: string;
  period: string;
  metric_key: string;
  value: number;
  created_at: string;
  updated_at: string;
};

export type ChallengeRow = {
  id: string;
  title: string;
  description: string | null;
  metric_label: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};

export type ChallengeParticipantRow = {
  challenge_id: string;
  user_id: string;
  progress: number;
  leaderboard_opt_in: boolean;
  created_at: string;
  updated_at: string;
};

export type TemplateRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  audience: "mentee" | "any";
  sort: number;
  created_at: string;
  updated_at: string;
};

export type TemplateWeekRow = {
  id: string;
  template_id: string;
  week: number;
  body: string;
  sort: number;
};

/* ---------- inserts (columns with defaults are optional) ---------- */

type Defaulted = "created_at" | "updated_at";

export type ProfileInsert = Partial<ProfileRow> & Pick<ProfileRow, "id">;
export type CircleInsert = Partial<Pick<CircleRow, "id" | "cadence" | "cohort_label" | "status" | Defaulted>> &
  Pick<CircleRow, "kind" | "name">;
export type CircleMemberInsert = Partial<Pick<CircleMemberRow, "role" | "joined_at" | "left_at">> &
  Pick<CircleMemberRow, "circle_id" | "user_id">;
export type SittingInsert = Partial<Pick<SittingRow, "id" | "status" | "join_url" | "notes" | Defaulted>> &
  Pick<SittingRow, "circle_id" | "scheduled_at" | "created_by">;
export type GoalBlockInsert = Partial<Pick<GoalBlockRow, "id" | "description" | "status" | "template_id" | Defaulted>> &
  Pick<GoalBlockRow, "user_id" | "title" | "start_date" | "end_date">;
export type CommitmentInsert = Partial<Pick<CommitmentRow, "id" | "status" | "carried_from" | "sitting_id" | Defaulted>> &
  Pick<CommitmentRow, "block_id" | "user_id" | "week" | "body">;
export type CheckInInsert = Partial<
  Pick<CheckInRow, "id" | "circle_id" | "block_week" | "did_well" | "struggled_with" | "next_focus" | "energy" | "completed_at" | "updated_at">
> &
  Pick<CheckInRow, "user_id" | "week_key">;
export type WinInsert = Partial<Pick<WinRow, "id" | "block_id" | "detail" | "archived_at" | Defaulted>> &
  Pick<WinRow, "user_id" | "title">;
export type MessageInsert = Partial<Pick<MessageRow, "id" | "read_at" | Defaulted>> &
  Pick<MessageRow, "circle_id" | "sender_id" | "body">;
export type NoteInsert = Partial<Pick<NoteRow, "id" | "commitment_id" | "check_in_id" | Defaulted>> &
  Pick<NoteRow, "author_id" | "about_user_id" | "body">;
export type BenchmarkEntryInsert = Partial<Pick<BenchmarkEntryRow, "id" | Defaulted>> &
  Pick<BenchmarkEntryRow, "user_id" | "period" | "metric_key" | "value">;
export type ChallengeInsert = Partial<Pick<ChallengeRow, "id" | "description" | Defaulted>> &
  Pick<ChallengeRow, "title" | "metric_label" | "start_date" | "end_date">;
export type ChallengeParticipantInsert = Partial<Pick<ChallengeParticipantRow, "progress" | "leaderboard_opt_in" | Defaulted>> &
  Pick<ChallengeParticipantRow, "challenge_id" | "user_id">;
export type TemplateInsert = Partial<Pick<TemplateRow, "description" | "audience" | "sort" | Defaulted>> &
  Pick<TemplateRow, "id" | "slug" | "title">;
export type TemplateWeekInsert = Partial<Pick<TemplateWeekRow, "id" | "sort">> &
  Pick<TemplateWeekRow, "template_id" | "week" | "body">;

/* ---------- functions ---------- */

export type CohortStatsRow = {
  cohort_size: number;
  median: number;
  p25: number;
  p75: number;
};

export type LeaderboardRpcRow = {
  user_id: string;
  display_name: string;
  progress: number;
  rank: number;
};

/* ---------- the schema ---------- */

type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: Relationship[];
};

export type Database = {
  public: {
    Tables: {
      regions: Table<RegionRow, RegionRow>;
      profiles: Table<ProfileRow, ProfileInsert>;
      circles: Table<CircleRow, CircleInsert>;
      circle_members: Table<CircleMemberRow, CircleMemberInsert>;
      sittings: Table<SittingRow, SittingInsert>;
      goal_blocks: Table<GoalBlockRow, GoalBlockInsert>;
      commitments: Table<CommitmentRow, CommitmentInsert>;
      check_ins: Table<CheckInRow, CheckInInsert>;
      wins: Table<WinRow, WinInsert>;
      messages: Table<MessageRow, MessageInsert>;
      notes: Table<NoteRow, NoteInsert>;
      benchmark_entries: Table<BenchmarkEntryRow, BenchmarkEntryInsert>;
      challenges: Table<ChallengeRow, ChallengeInsert>;
      challenge_participants: Table<ChallengeParticipantRow, ChallengeParticipantInsert>;
      templates: Table<TemplateRow, TemplateInsert>;
      template_weeks: Table<TemplateWeekRow, TemplateWeekInsert>;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_circle_member: { Args: { p_circle: string }; Returns: boolean };
      is_mentor_of: { Args: { p_target: string }; Returns: boolean };
      shares_circle_with: { Args: { p_target: string }; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      benchmark_cohort_stats: {
        Args: { p_metric: string; p_period: string; p_region?: string | null; p_practice_type?: string | null };
        Returns: CohortStatsRow[];
      };
      challenge_leaderboard: { Args: { p_challenge: string }; Returns: LeaderboardRpcRow[] };
      recompute_consistency: { Args: { p_user: string }; Returns: number };
      recompute_all_consistency: { Args: Record<PropertyKey, never>; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type { Json };
