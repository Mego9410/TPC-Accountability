import "server-only";
import type { PostgrestError, User } from "@supabase/supabase-js";
import type {
  BenchmarkEntry,
  Challenge,
  ChallengeParticipant,
  CheckIn,
  Circle,
  CircleRole,
  CircleWithMembers,
  CohortStat,
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
import { blockEndDate } from "@/lib/weeks";
import { createClient, type ServerClient } from "@/lib/supabase/server";
import type { CreateSittingInput, Repo } from "../types";
import type { CircleRow, CohortStatsRow } from "./database.types";
import {
  blockCols,
  checkInCols,
  commitmentCols,
  patchRow,
  profileCols,
  sittingCols,
  toBenchmarkEntry,
  toBlock,
  toChallenge,
  toCheckIn,
  toCircle,
  toCircleMember,
  toCommitment,
  toLeaderboardRow,
  toMessage,
  toNote,
  toParticipant,
  toProfile,
  toSitting,
  toTemplate,
  toWin,
  winCols,
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
  async listAllProfiles(): Promise<Profile[]> {
    return rows(
      await this.db.from("profiles").select().neq("role", "staff").order("full_name"),
      "listAllProfiles",
    ).map(toProfile);
  }
  async updateProfile(id: string, patch: Partial<Profile>): Promise<Profile> {
    const row = must(
      await this.db.from("profiles").update(patchRow(patch, profileCols)).eq("id", id).select().single(),
      "updateProfile",
    );
    return toProfile(row);
  }

  /* ---------- circles ---------- */

  /**
   * Attach members (with their profiles) to a set of circles in two queries
   * regardless of how many circles or members there are.
   */
  private async hydrate(circleRows: CircleRow[]): Promise<CircleWithMembers[]> {
    if (circleRows.length === 0) return [];
    const memberRows = rows(
      await this.db
        .from("circle_members")
        .select()
        .in("circle_id", circleRows.map((c) => c.id))
        .is("left_at", null)
        .order("joined_at"),
      "listCircleMembers",
    );
    const userIds = [...new Set(memberRows.map((m) => m.user_id))];
    const profiles = new Map((await this.listProfiles(userIds)).map((p) => [p.id, p]));
    return circleRows.map((c) => ({
      ...toCircle(c),
      members: memberRows
        .filter((m) => m.circle_id === c.id)
        .flatMap((m) => {
          const profile = profiles.get(m.user_id);
          return profile ? [{ ...toCircleMember(m), profile }] : [];
        }),
    }));
  }

  async listCirclesFor(userId: string): Promise<CircleWithMembers[]> {
    const mine = rows(
      await this.db.from("circle_members").select("circle_id").eq("user_id", userId).is("left_at", null),
      "listCirclesFor",
    ).map((m) => m.circle_id);
    if (mine.length === 0) return [];
    const circles = rows(
      await this.db.from("circles").select().in("id", mine).eq("status", "active").order("created_at"),
      "listCirclesFor",
    );
    return this.hydrate(circles);
  }
  async getCircle(id: string): Promise<CircleWithMembers | null> {
    const row = ok(await this.db.from("circles").select().eq("id", id).maybeSingle(), "getCircle");
    if (!row) return null;
    const [circle] = await this.hydrate([row]);
    return circle ?? null;
  }
  async listAllCircles(): Promise<CircleWithMembers[]> {
    return this.hydrate(rows(await this.db.from("circles").select().order("created_at"), "listAllCircles"));
  }
  async createCircle(input: Pick<Circle, "kind" | "name" | "cadence" | "cohortLabel">): Promise<Circle> {
    const row = must(
      await this.db
        .from("circles")
        .insert({ kind: input.kind, name: input.name, cadence: input.cadence, cohort_label: input.cohortLabel })
        .select()
        .single(),
      "createCircle",
    );
    return toCircle(row);
  }
  async setCircleMember(circleId: string, userId: string, role: CircleRole | null): Promise<void> {
    if (role === null) {
      // Leaving is recorded, not erased: the row keeps its history.
      ok(
        await this.db
          .from("circle_members")
          .update({ left_at: new Date().toISOString() })
          .eq("circle_id", circleId)
          .eq("user_id", userId)
          .is("left_at", null),
        "setCircleMember",
      );
      return;
    }
    // Joining, rejoining, or changing role. joined_at keeps its original value
    // on a rejoin, which is the honest date.
    ok(
      await this.db
        .from("circle_members")
        .upsert({ circle_id: circleId, user_id: userId, role, left_at: null }, { onConflict: "circle_id,user_id" }),
      "setCircleMember",
    );
  }

  /* ---------- sittings ---------- */
  async listSittings(circleIds: string[]): Promise<Sitting[]> {
    if (circleIds.length === 0) return [];
    return rows(
      await this.db.from("sittings").select().in("circle_id", circleIds).order("scheduled_at"),
      "listSittings",
    ).map(toSitting);
  }
  async getSitting(id: string): Promise<Sitting | null> {
    const row = ok(await this.db.from("sittings").select().eq("id", id).maybeSingle(), "getSitting");
    return row ? toSitting(row) : null;
  }
  async createSitting(input: CreateSittingInput): Promise<Sitting> {
    const row = must(
      await this.db
        .from("sittings")
        .insert({
          circle_id: input.circleId,
          scheduled_at: input.scheduledAt,
          created_by: input.createdBy,
          join_url: input.joinUrl ?? null,
          kind: input.kind ?? "video",
          host_id: input.hostId ?? null,
          location: input.location ?? null,
        })
        .select()
        .single(),
      "createSitting",
    );
    return toSitting(row);
  }
  async updateSitting(id: string, patch: Partial<Sitting>): Promise<Sitting> {
    const row = must(
      await this.db.from("sittings").update(patchRow(patch, sittingCols)).eq("id", id).select().single(),
      "updateSitting",
    );
    return toSitting(row);
  }

  /* ---------- blocks ---------- */
  async listBlocks(userId: string): Promise<GoalBlock[]> {
    return rows(
      await this.db.from("goal_blocks").select().eq("user_id", userId).order("start_date", { ascending: false }),
      "listBlocks",
    ).map(toBlock);
  }
  async listBlocksFor(userIds: string[]): Promise<GoalBlock[]> {
    if (userIds.length === 0) return [];
    return rows(
      await this.db.from("goal_blocks").select().in("user_id", userIds).order("start_date", { ascending: false }),
      "listBlocksFor",
    ).map(toBlock);
  }
  async getBlock(id: string): Promise<GoalBlock | null> {
    const row = ok(await this.db.from("goal_blocks").select().eq("id", id).maybeSingle(), "getBlock");
    return row ? toBlock(row) : null;
  }
  async createBlock(
    input: Pick<GoalBlock, "userId" | "title" | "description" | "startDate" | "templateId">,
  ): Promise<GoalBlock> {
    const row = must(
      await this.db
        .from("goal_blocks")
        .insert({
          user_id: input.userId,
          title: input.title,
          description: input.description,
          start_date: input.startDate,
          end_date: blockEndDate(input.startDate),
          template_id: input.templateId,
        })
        .select()
        .single(),
      "createBlock",
    );
    return toBlock(row);
  }
  async updateBlock(id: string, patch: Partial<GoalBlock>): Promise<GoalBlock> {
    const row = must(
      await this.db.from("goal_blocks").update(patchRow(patch, blockCols)).eq("id", id).select().single(),
      "updateBlock",
    );
    return toBlock(row);
  }

  /* ---------- commitments ---------- */
  async listCommitments(blockId: string): Promise<Commitment[]> {
    return rows(
      await this.db.from("commitments").select().eq("block_id", blockId).order("week").order("created_at"),
      "listCommitments",
    ).map(toCommitment);
  }
  async listCommitmentsFor(userIds: string[]): Promise<Commitment[]> {
    if (userIds.length === 0) return [];
    return rows(
      await this.db.from("commitments").select().in("user_id", userIds).order("week").order("created_at"),
      "listCommitmentsFor",
    ).map(toCommitment);
  }
  async createCommitment(
    input: Pick<Commitment, "blockId" | "userId" | "week" | "text"> & { carriedFrom?: string | null; sittingId?: string | null },
  ): Promise<Commitment> {
    const row = must(
      await this.db
        .from("commitments")
        .insert({
          block_id: input.blockId,
          user_id: input.userId,
          week: input.week,
          body: input.text,
          carried_from: input.carriedFrom ?? null,
          sitting_id: input.sittingId ?? null,
        })
        .select()
        .single(),
      "createCommitment",
    );
    return toCommitment(row);
  }
  async updateCommitment(id: string, patch: Partial<Commitment>): Promise<Commitment> {
    const row = must(
      await this.db.from("commitments").update(patchRow(patch, commitmentCols)).eq("id", id).select().single(),
      "updateCommitment",
    );
    return toCommitment(row);
  }

  /* ---------- check-ins ---------- */
  async listCheckIns(userId: string, limit = 60): Promise<CheckIn[]> {
    return rows(
      await this.db
        .from("check_ins")
        .select()
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(limit),
      "listCheckIns",
    ).map(toCheckIn);
  }
  async listCheckInsFor(userIds: string[], limit = 100): Promise<CheckIn[]> {
    if (userIds.length === 0) return [];
    return rows(
      await this.db
        .from("check_ins")
        .select()
        .in("user_id", userIds)
        .order("completed_at", { ascending: false })
        .limit(limit),
      "listCheckInsFor",
    ).map(toCheckIn);
  }
  async createCheckIn(input: Omit<CheckIn, "id" | "completedAt">): Promise<CheckIn> {
    const row = must(
      await this.db
        .from("check_ins")
        .insert({
          user_id: input.userId,
          circle_id: input.circleId,
          week_key: input.weekKey,
          block_week: input.blockWeek,
          did_well: input.didWell,
          struggled_with: input.struggledWith,
          next_focus: input.nextFocus,
          energy: input.energy,
        })
        .select()
        .single(),
      "createCheckIn",
    );
    return toCheckIn(row);
  }
  async updateCheckIn(id: string, patch: Partial<CheckIn>): Promise<CheckIn> {
    const row = must(
      await this.db.from("check_ins").update(patchRow(patch, checkInCols)).eq("id", id).select().single(),
      "updateCheckIn",
    );
    return toCheckIn(row);
  }

  /* ---------- wins ---------- */
  async listWins(userId: string, includeArchived = false): Promise<Win[]> {
    let q = this.db.from("wins").select().eq("user_id", userId);
    if (!includeArchived) q = q.is("archived_at", null);
    return rows(await q.order("created_at", { ascending: false }), "listWins").map(toWin);
  }
  async listWinsFor(userIds: string[]): Promise<Win[]> {
    if (userIds.length === 0) return [];
    return rows(
      await this.db
        .from("wins")
        .select()
        .in("user_id", userIds)
        .is("archived_at", null)
        .order("created_at", { ascending: false }),
      "listWinsFor",
    ).map(toWin);
  }
  async createWin(input: Pick<Win, "userId" | "title" | "detail" | "blockId">): Promise<Win> {
    const row = must(
      await this.db
        .from("wins")
        .insert({ user_id: input.userId, title: input.title, detail: input.detail, block_id: input.blockId })
        .select()
        .single(),
      "createWin",
    );
    return toWin(row);
  }
  async updateWin(id: string, patch: Partial<Win>): Promise<Win> {
    const row = must(
      await this.db.from("wins").update(patchRow(patch, winCols)).eq("id", id).select().single(),
      "updateWin",
    );
    return toWin(row);
  }

  /* ---------- messages ---------- */
  async listMessages(circleId: string): Promise<Message[]> {
    return rows(
      await this.db.from("messages").select().eq("circle_id", circleId).order("created_at"),
      "listMessages",
    ).map(toMessage);
  }
  async createMessage(input: Pick<Message, "circleId" | "senderId" | "body">): Promise<Message> {
    const row = must(
      await this.db
        .from("messages")
        .insert({ circle_id: input.circleId, sender_id: input.senderId, body: input.body })
        .select()
        .single(),
      "createMessage",
    );
    return toMessage(row);
  }
  /** Mark everything in the circle that others sent as read by this reader. */
  async markRead(circleId: string, readerId: string): Promise<void> {
    ok(
      await this.db
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("circle_id", circleId)
        .neq("sender_id", readerId)
        .is("read_at", null),
      "markRead",
    );
  }
  async countUnread(circleIds: string[], readerId: string): Promise<number> {
    if (circleIds.length === 0) return 0;
    const { count, error } = await this.db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("circle_id", circleIds)
      .neq("sender_id", readerId)
      .is("read_at", null);
    if (error) throw new Error(`countUnread: ${error.message}`);
    return count ?? 0;
  }

  /* ---------- notes ---------- */
  async listNotesAbout(userId: string): Promise<Note[]> {
    return rows(
      await this.db.from("notes").select().eq("about_user_id", userId).order("created_at", { ascending: false }),
      "listNotesAbout",
    ).map(toNote);
  }
  async listNotesBy(authorId: string): Promise<Note[]> {
    return rows(
      await this.db.from("notes").select().eq("author_id", authorId).order("created_at", { ascending: false }),
      "listNotesBy",
    ).map(toNote);
  }
  async createNote(
    input: Pick<Note, "authorId" | "aboutUserId" | "body"> & { commitmentId?: string | null; checkInId?: string | null },
  ): Promise<Note> {
    const row = must(
      await this.db
        .from("notes")
        .insert({
          author_id: input.authorId,
          about_user_id: input.aboutUserId,
          body: input.body,
          commitment_id: input.commitmentId ?? null,
          check_in_id: input.checkInId ?? null,
        })
        .select()
        .single(),
      "createNote",
    );
    return toNote(row);
  }

  /* ---------- benchmarks ---------- */
  async listBenchmarkEntries(userId: string): Promise<BenchmarkEntry[]> {
    return rows(
      await this.db.from("benchmark_entries").select().eq("user_id", userId).order("period"),
      "listBenchmarkEntries",
    ).map(toBenchmarkEntry);
  }
  async upsertBenchmarkEntry(
    input: Pick<BenchmarkEntry, "userId" | "period" | "metricKey" | "value">,
  ): Promise<BenchmarkEntry> {
    const row = must(
      await this.db
        .from("benchmark_entries")
        .upsert(
          { user_id: input.userId, period: input.period, metric_key: input.metricKey, value: input.value },
          { onConflict: "user_id,period,metric_key" },
        )
        .select()
        .single(),
      "upsertBenchmarkEntry",
    );
    return toBenchmarkEntry(row);
  }
  /**
   * The cohort's median and quartiles, from the guarded function in the
   * database (it returns nothing for a cohort under five). If the narrowed
   * cohort is too small, the club-wide figure is offered instead.
   */
  async cohortStats(
    metricKey: string,
    period: string,
    region: string | null,
    practiceType: string | null,
  ): Promise<CohortStat | null> {
    const ask = async (r: string | null, t: string | null): Promise<CohortStatsRow | null> => {
      const res = await this.db.rpc("benchmark_cohort_stats", {
        p_metric: metricKey,
        p_period: period,
        p_region: r,
        p_practice_type: t,
      });
      return rows(res, "cohortStats")[0] ?? null;
    };
    const narrowed = region !== null || practiceType !== null;
    if (narrowed) {
      const s = await ask(region, practiceType);
      if (s) return { scope: "cohort", cohortSize: s.cohort_size, median: Number(s.median), p25: Number(s.p25), p75: Number(s.p75) };
    }
    const club = await ask(null, null);
    if (!club) return null;
    return { scope: "club", cohortSize: club.cohort_size, median: Number(club.median), p25: Number(club.p25), p75: Number(club.p75) };
  }

  /* ---------- challenges ---------- */
  async listChallenges(): Promise<Challenge[]> {
    return rows(
      await this.db.from("challenges").select().order("start_date", { ascending: false }),
      "listChallenges",
    ).map(toChallenge);
  }
  async getChallenge(id: string): Promise<Challenge | null> {
    const row = ok(await this.db.from("challenges").select().eq("id", id).maybeSingle(), "getChallenge");
    return row ? toChallenge(row) : null;
  }
  async createChallenge(
    input: Pick<Challenge, "title" | "description" | "metricLabel" | "startDate" | "endDate">,
  ): Promise<Challenge> {
    const row = must(
      await this.db
        .from("challenges")
        .insert({
          title: input.title,
          description: input.description,
          metric_label: input.metricLabel,
          start_date: input.startDate,
          end_date: input.endDate,
        })
        .select()
        .single(),
      "createChallenge",
    );
    return toChallenge(row);
  }
  async listParticipation(userId: string): Promise<ChallengeParticipant[]> {
    return rows(
      await this.db.from("challenge_participants").select().eq("user_id", userId),
      "listParticipation",
    ).map(toParticipant);
  }
  async setParticipation(input: ChallengeParticipant): Promise<ChallengeParticipant> {
    const row = must(
      await this.db
        .from("challenge_participants")
        .upsert(
          {
            challenge_id: input.challengeId,
            user_id: input.userId,
            progress: input.progress,
            leaderboard_opt_in: input.leaderboardOptIn,
          },
          { onConflict: "challenge_id,user_id" },
        )
        .select()
        .single(),
      "setParticipation",
    );
    return toParticipant(row);
  }
  async leaderboard(challengeId: string): Promise<LeaderboardRow[]> {
    return rows(await this.db.rpc("challenge_leaderboard", { p_challenge: challengeId }), "leaderboard").map(
      toLeaderboardRow,
    );
  }

  /* ---------- templates ---------- */
  async listTemplates(): Promise<Template[]> {
    const [templates, weeks] = await Promise.all([
      this.db.from("templates").select().order("sort"),
      this.db.from("template_weeks").select().order("week").order("sort"),
    ]);
    const weekRows = rows(weeks, "listTemplates");
    return rows(templates, "listTemplates").map((t) => toTemplate(t, weekRows));
  }
  async getTemplate(id: string): Promise<Template | null> {
    const [template, weeks] = await Promise.all([
      this.db.from("templates").select().eq("id", id).maybeSingle(),
      this.db.from("template_weeks").select().eq("template_id", id).order("week").order("sort"),
    ]);
    const row = ok(template, "getTemplate");
    return row ? toTemplate(row, rows(weeks, "getTemplate")) : null;
  }
}
