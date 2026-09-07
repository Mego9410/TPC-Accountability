/**
 * The shape of the Postgres schema in supabase/migrations, written by hand so
 * the client is typed end to end. Keep it in step with 0001_schema.sql and
 * 0002_policies.sql; the mappers in ./mappers.ts are the only place these
 * snake_case rows meet the camelCase domain.
 *
 * Every row is a `type` alias, never an `interface`: supabase-js resolves the
 * schema through a mapped conditional type, and an interface (having no index
 * signature) fails to satisfy it, collapsing every query result to `never`.
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
  focus_areas: string[];
  open_to_visits: boolean;
  open_to_partner: boolean;
  membership_no: string;
  role: "member" | "staff";
  onboarded: boolean;
  nudge_opt_out: boolean;
  created_at: string;
  updated_at: string;
};

export type PartnershipRow = {
  id: string;
  a_id: string;
  b_id: string;
  proposed_by_id: string;
  status: "proposed" | "active" | "declined" | "ended";
  message: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  detail: string | null;
  target_date: string | null;
  status: "open" | "done";
  done_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalUpdateRow = {
  id: string;
  goal_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type VisitRow = {
  id: string;
  visitor_id: string;
  host_id: string;
  proposed_by_id: string;
  scheduled_at: string;
  status: "proposed" | "agreed" | "declined" | "held" | "cancelled";
  practice_name: string | null;
  proposal_note: string | null;
  arrival_note: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  from_id: string;
  to_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

/* ---------- inserts (columns with defaults are optional) ---------- */

type Defaulted = "created_at" | "updated_at";

/** The row is made by the sign-up trigger, so every column but the id is optional. */
export type ProfileInsert = Partial<ProfileRow> & Pick<ProfileRow, "id">;

export type PartnershipInsert = Partial<
  Pick<PartnershipRow, "id" | "status" | "message" | "started_at" | "ended_at" | Defaulted>
> &
  Pick<PartnershipRow, "a_id" | "b_id" | "proposed_by_id">;

export type GoalInsert = Partial<
  Pick<GoalRow, "id" | "detail" | "target_date" | "status" | "done_at" | Defaulted>
> &
  Pick<GoalRow, "user_id" | "title">;

export type GoalUpdateInsert = Partial<Pick<GoalUpdateRow, "id" | "created_at">> &
  Pick<GoalUpdateRow, "goal_id" | "author_id" | "body">;

export type VisitInsert = Partial<
  Pick<
    VisitRow,
    "id" | "status" | "practice_name" | "proposal_note" | "arrival_note" | "notes" | Defaulted
  >
> &
  Pick<VisitRow, "visitor_id" | "host_id" | "proposed_by_id" | "scheduled_at">;

export type MessageInsert = Partial<Pick<MessageRow, "id" | "read_at" | "created_at">> &
  Pick<MessageRow, "from_id" | "to_id" | "body">;

/* ---------- updates (every column is optional; the row types drive them) ---------- */

export type ProfileUpdate = Partial<ProfileRow>;
export type PartnershipUpdate = Partial<PartnershipRow>;
export type GoalUpdatePatch = Partial<GoalRow>;
export type VisitUpdate = Partial<VisitRow>;

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
      partnerships: Table<PartnershipRow, PartnershipInsert>;
      goals: Table<GoalRow, GoalInsert>;
      goal_updates: Table<GoalUpdateRow, GoalUpdateInsert>;
      visits: Table<VisitRow, VisitInsert>;
      messages: Table<MessageRow, MessageInsert>;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_partner_of: { Args: { target: string }; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type { Json };
