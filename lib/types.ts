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
