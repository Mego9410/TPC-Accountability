import "server-only";
import type { PostgrestError, User } from "@supabase/supabase-js";
import type { Goal, GoalUpdate, Message, Partnership, Profile, Visit } from "@/lib/domain";
import { createClient, type ServerClient } from "@/lib/supabase/server";
import type { Repo } from "../types";
import {
  goalCols,
  partnershipCols,
  patchRow,
  profileCols,
  toGoal,
  toGoalUpdate,
  toMessage,
  toPartnership,
  toProfile,
  toVisit,
  visitCols,
} from "./mappers";

/** The signed-in Supabase user, or null. */
export async function currentUser(): Promise<User | null> {
  const db = await createClient();
  const { data } = await db.auth.getUser();
  return data.user ?? null;
}

type Result<T> = { data: T | null; error: PostgrestError | null };

/** Throw on a query error; otherwise hand back the (possibly null) data. */
function ok<T>(res: Result<T>, what: string): T | null {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

/**
 * As `ok`, but the row must exist. (`NonNullable` because the failure branch
 * of a Postgrest response carries `data: null`, which would otherwise leak
 * into the inferred T.)
 */
function must<T>(res: Result<T>, what: string): NonNullable<T> {
  const data = ok(res, what);
  if (data === null || data === undefined) throw new Error(`${what}: not found`);
  return data;
}

function rows<T>(res: Result<T[]>, what: string): T[] {
  return ok(res, what) ?? [];
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * The real records. Every query runs as the signed-in member through the
 * request-bound client, so row level security (supabase/migrations/0002)
 * decides what they may see and change; this class only shapes the calls.
 */
export class SupabaseRepo implements Repo {
  private constructor(
    private readonly db: ServerClient,
    readonly userId: string,
  ) {}

  static async forUser(user: Pick<User, "id">): Promise<SupabaseRepo> {
    return new SupabaseRepo(await createClient(), user.id);
  }

  /** Nothing is buffered; every write has already reached Postgres. */
  async flush(): Promise<void> {}

  /* ---------- profiles ---------- */

  async getProfile(id: string): Promise<Profile | null> {
    const row = ok(await this.db.from("profiles").select().eq("id", id).maybeSingle(), "getProfile");
    return row ? toProfile(row) : null;
  }

  async listProfiles(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return [];
    return rows(await this.db.from("profiles").select().in("id", ids), "listProfiles").map(toProfile);
  }

  /** Everyone but the House. The members directory. */
  async listMembers(): Promise<Profile[]> {
    return rows(
      await this.db.from("profiles").select().neq("role", "staff").order("full_name"),
      "listMembers",
    ).map(toProfile);
  }

  async updateProfile(id: string, patch: Partial<Profile>): Promise<Profile> {
    const row = must(
      await this.db.from("profiles").update(patchRow(patch, profileCols)).eq("id", id).select().single(),
      "updateProfile",
    );
    return toProfile(row);
  }

  /* ---------- the partner ---------- */

  /** Every relationship this principal is a party to, newest first. */
  async listPartnerships(userId: string): Promise<Partnership[]> {
    return rows(
      await this.db
        .from("partnerships")
        .select()
        .or(`a_id.eq.${userId},b_id.eq.${userId}`)
        .order("created_at", { ascending: false }),
      "listPartnerships",
    ).map(toPartnership);
  }

  async getPartnership(id: string): Promise<Partnership | null> {
    const row = ok(
      await this.db.from("partnerships").select().eq("id", id).maybeSingle(),
      "getPartnership",
    );
    return row ? toPartnership(row) : null;
  }

  async createPartnership(
    input: Pick<Partnership, "aId" | "bId" | "proposedById"> & { message?: string | null },
  ): Promise<Partnership> {
    const row = must(
      await this.db
        .from("partnerships")
        .insert({
          a_id: input.aId,
          b_id: input.bId,
          proposed_by_id: input.proposedById,
          message: input.message ?? null,
        })
        .select()
        .single(),
      "createPartnership",
    );
    return toPartnership(row);
  }

  async updatePartnership(id: string, patch: Partial<Partnership>): Promise<Partnership> {
    const row = must(
      await this.db
        .from("partnerships")
        .update(patchRow(patch, partnershipCols))
        .eq("id", id)
        .select()
        .single(),
      "updatePartnership",
    );
    return toPartnership(row);
  }

  /* ---------- goals ---------- */

  /**
   * The open ones first, then by target date with the undated last — the order
   * the goals page reads in. Row level security means a member sees their own
   * goals and their partner's, and nothing else.
   */
  async listGoals(userIds: string[]): Promise<Goal[]> {
    if (userIds.length === 0) return [];
    return rows(
      await this.db
        .from("goals")
        .select()
        .in("user_id", userIds)
        .order("status", { ascending: false })
        .order("target_date", { ascending: true, nullsFirst: false }),
      "listGoals",
    ).map(toGoal);
  }

  async getGoal(id: string): Promise<Goal | null> {
    const row = ok(await this.db.from("goals").select().eq("id", id).maybeSingle(), "getGoal");
    return row ? toGoal(row) : null;
  }

  async createGoal(
    input: Pick<Goal, "userId" | "title"> & { detail?: string | null; targetDate?: string | null },
  ): Promise<Goal> {
    const row = must(
      await this.db
        .from("goals")
        .insert({
          user_id: input.userId,
          title: input.title,
          detail: input.detail ?? null,
          target_date: input.targetDate ?? null,
        })
        .select()
        .single(),
      "createGoal",
    );
    return toGoal(row);
  }

  async updateGoal(id: string, patch: Partial<Goal>): Promise<Goal> {
    const row = must(
      await this.db.from("goals").update(patchRow(patch, goalCols)).eq("id", id).select().single(),
      "updateGoal",
    );
    return toGoal(row);
  }

  /** The lines written against these goals, oldest first. */
  async listGoalUpdates(goalIds: string[]): Promise<GoalUpdate[]> {
    if (goalIds.length === 0) return [];
    return rows(
      await this.db
        .from("goal_updates")
        .select()
        .in("goal_id", goalIds)
        .neq("body", "")
        .order("created_at"),
      "listGoalUpdates",
    ).map(toGoalUpdate);
  }

  async createGoalUpdate(input: Pick<GoalUpdate, "goalId" | "authorId" | "body">): Promise<GoalUpdate> {
    const row = must(
      await this.db
        .from("goal_updates")
        .insert({ goal_id: input.goalId, author_id: input.authorId, body: input.body })
        .select()
        .single(),
      "createGoalUpdate",
    );
    return toGoalUpdate(row);
  }

  /* ---------- visits ---------- */

  /** Both sides of the arrangement — the mornings you are going to and hosting. */
  async listVisitsFor(userId: string): Promise<Visit[]> {
    return rows(
      await this.db
        .from("visits")
        .select()
        .or(`visitor_id.eq.${userId},host_id.eq.${userId}`)
        .order("scheduled_at"),
      "listVisitsFor",
    ).map(toVisit);
  }

  async getVisit(id: string): Promise<Visit | null> {
    const row = ok(await this.db.from("visits").select().eq("id", id).maybeSingle(), "getVisit");
    return row ? toVisit(row) : null;
  }

  async createVisit(
    input: Pick<Visit, "visitorId" | "hostId" | "proposedById" | "scheduledAt"> & {
      practiceName?: string | null;
      proposalNote?: string | null;
    },
  ): Promise<Visit> {
    const row = must(
      await this.db
        .from("visits")
        .insert({
          visitor_id: input.visitorId,
          host_id: input.hostId,
          proposed_by_id: input.proposedById,
          scheduled_at: input.scheduledAt,
          practice_name: input.practiceName ?? null,
          proposal_note: input.proposalNote ?? null,
        })
        .select()
        .single(),
      "createVisit",
    );
    return toVisit(row);
  }

  async updateVisit(id: string, patch: Partial<Visit>): Promise<Visit> {
    const row = must(
      await this.db.from("visits").update(patchRow(patch, visitCols)).eq("id", id).select().single(),
      "updateVisit",
    );
    return toVisit(row);
  }

  /* ---------- correspondence ---------- */

  /** One correspondence, oldest first. */
  async listMessagesWith(userId: string, otherId: string): Promise<Message[]> {
    return rows(
      await this.db
        .from("messages")
        .select()
        .or(
          `and(from_id.eq.${userId},to_id.eq.${otherId}),and(from_id.eq.${otherId},to_id.eq.${userId})`,
        )
        .order("created_at"),
      "listMessagesWith",
    ).map(toMessage);
  }

  /**
   * Every message either way, oldest first, so the page can group them by the
   * other party itself rather than asking twice.
   */
  async listCorrespondents(userId: string): Promise<Message[]> {
    return rows(
      await this.db
        .from("messages")
        .select()
        .or(`from_id.eq.${userId},to_id.eq.${userId}`)
        .order("created_at"),
      "listCorrespondents",
    ).map(toMessage);
  }

  async createMessage(input: Pick<Message, "fromId" | "toId" | "body">): Promise<Message> {
    const row = must(
      await this.db
        .from("messages")
        .insert({ from_id: input.fromId, to_id: input.toId, body: input.body })
        .select()
        .single(),
      "createMessage",
    );
    return toMessage(row);
  }

  /**
   * Mark what the other party sent as read. Only `read_at` is writable, and
   * only by the recipient (0002 revokes the rest at the column level).
   */
  async markRead(userId: string, otherId: string): Promise<void> {
    ok(
      await this.db
        .from("messages")
        .update({ read_at: nowIso() })
        .eq("to_id", userId)
        .eq("from_id", otherId)
        .is("read_at", null),
      "markRead",
    );
  }

  async countUnread(userId: string): Promise<number> {
    const { count, error } = await this.db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("to_id", userId)
      .is("read_at", null);
    if (error) throw new Error(`countUnread: ${error.message}`);
    return count ?? 0;
  }
}
