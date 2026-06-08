/**
 * Application + database types.
 *
 * The `Database` shape mirrors supabase/migrations/0001_init.sql. It is a
 * hand-maintained subset sufficient for typed queries; regenerate with the
 * Supabase CLI (`supabase gen types typescript`) once the schema settles.
 */

export type Cadence = "weekly" | "fortnightly" | "monthly";
export type PartnershipStatus = "active" | "ended";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";
export type GoalStatus = "open" | "done";
export type GoalSource = "manual" | "transcript";
export type MatchStatus = "queued" | "matched" | "paused";
export type CalendarProvider = "google" | "microsoft";

export type PracticeType = "NHS" | "Private" | "Mixed";

export interface Profile {
  id: string;
  honorific: string | null;
  full_name: string | null;
  practice_name: string | null;
  location: string | null;
  timezone: string | null;
  bio: string | null;
  avatar_url: string | null;
  membership_no: string | null;
  role: "principal" | "house";
  onboarded: boolean;
  // Accountability features (migration 0002): benchmark cohorting + paywall gate.
  region: string | null;
  practice_type: PracticeType | null;
  chair_count: number | null;
  is_paid_member: boolean;
  reliability_score: number;
  // Phase 2 (migration 0005): weekly check-in nudge opt-out.
  checkin_nudge_opt_out: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchPreference {
  id: string;
  user_id: string;
  focus_areas: string[];
  interests: string[];
  cadence: Cadence;
  preferred_times: string[];
  status: MatchStatus;
  created_at: string;
  updated_at: string;
}

export interface Partnership {
  id: string;
  member_a: string;
  member_b: string;
  cadence: Cadence;
  status: PartnershipStatus;
  created_at: string;
  ended_at: string | null;
}

export interface Meeting {
  id: string;
  partnership_id: string;
  scheduled_at: string;
  cadence: Cadence;
  daily_room_url: string | null;
  daily_room_name: string | null;
  status: MeetingStatus;
  google_event_id: string | null;
  microsoft_event_id: string | null;
  created_by: string;
  created_at: string;
}

export interface Goal {
  id: string;
  partnership_id: string;
  owner_id: string;
  meeting_id: string | null;
  title: string;
  detail: string | null;
  status: GoalStatus;
  source: GoalSource;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  partnership_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Transcript {
  id: string;
  meeting_id: string;
  raw_text: string;
  provider: string;
  created_at: string;
}

export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  calendar_id: string | null;
  account_email: string | null;
  created_at: string;
}

/* ---------- Accountability (migrations 0002 / 0005) ---------- */
export type PodStatus = "active" | "archived";
export type PodRole = "member" | "lead";

export interface Pod {
  id: string;
  name: string;
  cohort_label: string | null;
  status: PodStatus;
  created_at: string;
}

export interface PodMember {
  pod_id: string;
  user_id: string;
  role: PodRole;
  joined_at: string;
  left_at: string | null;
}

export type GoalBlockStatus = "active" | "completed" | "abandoned";
export type CommitmentStatus = "open" | "done" | "partial" | "missed" | "carried";

export interface GoalBlock {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: GoalBlockStatus;
  created_at: string;
}

export interface Commitment {
  id: string;
  goal_block_id: string;
  user_id: string;
  week_number: number;
  text: string;
  status: CommitmentStatus;
  carried_from: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  pod_id: string | null;
  week_number: number | null;
  did_well: string | null;
  struggled_with: string | null;
  next_week_focus: string | null;
  energy_score: number | null;
  completed_at: string;
}

export interface Win {
  id: string;
  user_id: string;
  goal_block_id: string | null;
  title: string;
  detail: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface GoalBlockTemplate {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort: number;
  created_at: string;
}

export interface TemplateCommitment {
  id: string;
  template_id: string;
  week_number: number;
  text: string;
  sort: number;
}

export interface BenchmarkEntry {
  id: string;
  user_id: string;
  period: string;
  metric_key: string;
  metric_value: number;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface ChallengeParticipant {
  challenge_id: string;
  user_id: string;
  progress: number;
  leaderboard_opt_in: boolean;
}

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile, Partial<Profile> & { id: string }, Partial<Profile>>;
      match_preferences: Table<
        MatchPreference,
        Partial<MatchPreference> & { user_id: string },
        Partial<MatchPreference>
      >;
      partnerships: Table<
        Partnership,
        Partial<Partnership> & { member_a: string; member_b: string },
        Partial<Partnership>
      >;
      meetings: Table<
        Meeting,
        Partial<Meeting> & { partnership_id: string; scheduled_at: string; created_by: string },
        Partial<Meeting>
      >;
      goals: Table<
        Goal,
        Partial<Goal> & { partnership_id: string; owner_id: string; title: string },
        Partial<Goal>
      >;
      messages: Table<
        Message,
        Partial<Message> & { partnership_id: string; sender_id: string; body: string },
        Partial<Message>
      >;
      transcripts: Table<
        Transcript,
        Partial<Transcript> & { meeting_id: string; raw_text: string },
        Partial<Transcript>
      >;
      calendar_connections: Table<
        CalendarConnection,
        Partial<CalendarConnection> & { user_id: string; provider: CalendarProvider },
        Partial<CalendarConnection>
      >;
      goal_blocks: Table<
        GoalBlock,
        Partial<GoalBlock> & {
          user_id: string;
          title: string;
          start_date: string;
          end_date: string;
        },
        Partial<GoalBlock>
      >;
      commitments: Table<
        Commitment,
        Partial<Commitment> & {
          goal_block_id: string;
          user_id: string;
          week_number: number;
          text: string;
        },
        Partial<Commitment>
      >;
      check_ins: Table<CheckIn, Partial<CheckIn> & { user_id: string }, Partial<CheckIn>>;
      wins: Table<Win, Partial<Win> & { user_id: string; title: string }, Partial<Win>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/** A partnership with both member profiles resolved, from the current user's view. */
export interface PartnershipWithPartner extends Partnership {
  partner: Profile;
}
