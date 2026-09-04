import "server-only";
import type {
  BenchmarkEntry,
  Challenge,
  ChallengeParticipant,
  CheckIn,
  Circle,
  CircleMember,
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
import { MIN_COHORT } from "@/lib/benchmarks";
import type { Repo } from "../types";
import { world } from "./world";
import { type DemoDelta, writeDelta } from "./store";

type Row = { id: string };
type Collection = keyof typeof world;

let seq = 0;
function newId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}${seq.toString(36)}`;
}
function now(): string {
  return new Date().toISOString();
}

/**
 * The furnished example plus the visitor's delta. Reads merge base + delta;
 * writes go to the delta and are flushed to the cookie at the end of the
 * action. Deterministic, stateless, and honest: nothing here reaches a server.
 */
export class DemoRepo implements Repo {
  private dirty = false;

  constructor(private delta: DemoDelta) {}

  get persona() {
    return this.delta.persona;
  }

  /* ---------- merge helpers ---------- */
  private all<T extends Row>(col: Collection): T[] {
    const base = world[col] as unknown as T[];
    const added = (this.delta.a[col] ?? []) as unknown as T[];
    const patches = this.delta.m[col] ?? {};
    return [...base, ...added].map((row) => (patches[row.id] ? ({ ...row, ...patches[row.id] } as T) : row));
  }
  private add<T extends Row>(col: Collection, row: T): T {
    (this.delta.a[col] ??= []).push(row as unknown as Record<string, unknown>);
    this.dirty = true;
    return row;
  }
  private patch<T extends Row>(col: Collection, id: string, patch: Partial<T>): T {
    const existing = this.all<T>(col).find((r) => r.id === id);
    if (!existing) throw new Error(`Not found: ${col}/${id}`);
    (this.delta.m[col] ??= {})[id] = { ...(this.delta.m[col]?.[id] ?? {}), ...patch };
    this.dirty = true;
    return { ...existing, ...patch };
  }

  async flush(): Promise<void> {
    if (!this.dirty) return;
    await writeDelta(this.delta);
    this.dirty = false;
  }

  /* ---------- profiles ---------- */
  async getProfile(id: string) {
    return this.all<Profile>("profiles").find((p) => p.id === id) ?? null;
  }
  async listProfiles(ids: string[]) {
    const set = new Set(ids);
    return this.all<Profile>("profiles").filter((p) => set.has(p.id));
  }
  async listAllProfiles() {
    return this.all<Profile>("profiles").filter((p) => p.role !== "staff");
  }
  async updateProfile(id: string, patch: Partial<Profile>) {
    return this.patch<Profile>("profiles", id, patch);
  }

  /* ---------- circles ---------- */
  private hydrate(circle: Circle): CircleWithMembers {
    const profiles = this.all<Profile>("profiles");
    const members = this.memberRows()
      .filter((m) => m.circleId === circle.id)
      .map((m) => ({ ...m, profile: profiles.find((p) => p.id === m.userId)! }))
      .filter((m) => m.profile);
    return { ...circle, members };
  }
  private memberRows(): CircleMember[] {
    // circleMembers are keyed by circleId+userId; we model removals as role null patches.
    const rows = (this.all as unknown as (c: Collection) => (CircleMember & { id: string; role: CircleRole | null })[])
      .call(this, "circleMembers");
    return rows.filter((m) => m.role !== null) as CircleMember[];
  }
  async listCirclesFor(userId: string) {
    const mine = new Set(this.memberRows().filter((m) => m.userId === userId).map((m) => m.circleId));
    return this.all<Circle>("circles")
      .filter((c) => mine.has(c.id) && c.status === "active")
      .map((c) => this.hydrate(c));
  }
  async getCircle(id: string) {
    const c = this.all<Circle>("circles").find((x) => x.id === id);
    return c ? this.hydrate(c) : null;
  }
  async listAllCircles() {
    return this.all<Circle>("circles").map((c) => this.hydrate(c));
  }
  async createCircle(input: Pick<Circle, "kind" | "name" | "cadence" | "cohortLabel">) {
    return this.add<Circle>("circles", { id: newId("c"), status: "active", createdAt: now(), ...input });
  }
  async setCircleMember(circleId: string, userId: string, role: CircleRole | null) {
    const id = `${circleId}:${userId}`;
    const rows = (this.all as unknown as (c: Collection) => (CircleMember & { id: string })[]).call(this, "circleMembers");
    const existing = rows.find((m) => m.id === id);
    if (existing) {
      this.patch("circleMembers", id, { role });
    } else if (role) {
      this.add("circleMembers", { id, circleId, userId, role, joinedAt: now() });
    }
  }

  /* ---------- sittings ---------- */
  async listSittings(circleIds: string[]) {
    const set = new Set(circleIds);
    return this.all<Sitting>("sittings")
      .filter((s) => set.has(s.circleId))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
  async getSitting(id: string) {
    return this.all<Sitting>("sittings").find((s) => s.id === id) ?? null;
  }
  async createSitting(input: Pick<Sitting, "circleId" | "scheduledAt" | "createdBy"> & { joinUrl?: string | null }) {
    return this.add<Sitting>("sittings", {
      id: newId("s"),
      status: "scheduled",
      notes: null,
      joinUrl: input.joinUrl ?? null,
      createdAt: now(),
      ...input,
    });
  }
  async updateSitting(id: string, patch: Partial<Sitting>) {
    return this.patch<Sitting>("sittings", id, patch);
  }

  /* ---------- blocks ---------- */
  async listBlocks(userId: string) {
    return this.all<GoalBlock>("blocks")
      .filter((b) => b.userId === userId)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }
  async listBlocksFor(userIds: string[]) {
    const set = new Set(userIds);
    return this.all<GoalBlock>("blocks").filter((b) => set.has(b.userId));
  }
  async getBlock(id: string) {
    return this.all<GoalBlock>("blocks").find((b) => b.id === id) ?? null;
  }
  async createBlock(input: Pick<GoalBlock, "userId" | "title" | "description" | "startDate" | "templateId">) {
    return this.add<GoalBlock>("blocks", {
      id: newId("b"),
      status: "active",
      endDate: blockEndDate(input.startDate),
      createdAt: now(),
      ...input,
    });
  }
  async updateBlock(id: string, patch: Partial<GoalBlock>) {
    return this.patch<GoalBlock>("blocks", id, patch);
  }
  async listCommitments(blockId: string) {
    return this.all<Commitment>("commitments")
      .filter((c) => c.blockId === blockId)
      .sort((a, b) => a.week - b.week || a.createdAt.localeCompare(b.createdAt));
  }
  async listCommitmentsFor(userIds: string[]) {
    const set = new Set(userIds);
    return this.all<Commitment>("commitments").filter((c) => set.has(c.userId));
  }
  async createCommitment(input: Pick<Commitment, "blockId" | "userId" | "week" | "text"> & { carriedFrom?: string | null; sittingId?: string | null }) {
    return this.add<Commitment>("commitments", {
      id: newId("cm"),
      status: "open",
      carriedFrom: input.carriedFrom ?? null,
      sittingId: input.sittingId ?? null,
      createdAt: now(),
      ...input,
    });
  }
  async updateCommitment(id: string, patch: Partial<Commitment>) {
    return this.patch<Commitment>("commitments", id, patch);
  }

  /* ---------- check-ins ---------- */
  async listCheckIns(userId: string, limit = 60) {
    return this.all<CheckIn>("checkIns")
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, limit);
  }
  async listCheckInsFor(userIds: string[], limit = 100) {
    const set = new Set(userIds);
    return this.all<CheckIn>("checkIns")
      .filter((c) => set.has(c.userId))
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, limit);
  }
  async createCheckIn(input: Omit<CheckIn, "id" | "completedAt">) {
    return this.add<CheckIn>("checkIns", { id: newId("ci"), completedAt: now(), ...input });
  }
  async updateCheckIn(id: string, patch: Partial<CheckIn>) {
    return this.patch<CheckIn>("checkIns", id, patch);
  }

  /* ---------- wins ---------- */
  async listWins(userId: string, includeArchived = false) {
    return this.all<Win>("wins")
      .filter((w) => w.userId === userId && (includeArchived || !w.archivedAt))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listWinsFor(userIds: string[]) {
    const set = new Set(userIds);
    return this.all<Win>("wins")
      .filter((w) => set.has(w.userId) && !w.archivedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async createWin(input: Pick<Win, "userId" | "title" | "detail" | "blockId">) {
    return this.add<Win>("wins", { id: newId("w"), archivedAt: null, createdAt: now(), ...input });
  }
  async updateWin(id: string, patch: Partial<Win>) {
    return this.patch<Win>("wins", id, patch);
  }

  /* ---------- messages ---------- */
  async listMessages(circleId: string) {
    return this.all<Message>("messages")
      .filter((m) => m.circleId === circleId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async createMessage(input: Pick<Message, "circleId" | "senderId" | "body">) {
    return this.add<Message>("messages", { id: newId("m"), readAt: null, createdAt: now(), ...input });
  }
  async markRead(circleId: string, readerId: string) {
    this.delta.r[`${circleId}:${readerId}`] = now();
    this.dirty = true;
  }
  async countUnread(circleIds: string[], readerId: string) {
    let n = 0;
    for (const circleId of circleIds) {
      const since = this.delta.r[`${circleId}:${readerId}`] ?? "";
      n += this.all<Message>("messages").filter(
        (m) => m.circleId === circleId && m.senderId !== readerId && !m.readAt && m.createdAt > since,
      ).length;
    }
    return n;
  }

  /* ---------- notes ---------- */
  async listNotesAbout(userId: string) {
    return this.all<Note>("notes")
      .filter((n) => n.aboutUserId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listNotesBy(authorId: string) {
    return this.all<Note>("notes")
      .filter((n) => n.authorId === authorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async createNote(input: Pick<Note, "authorId" | "aboutUserId" | "body"> & { commitmentId?: string | null; checkInId?: string | null }) {
    return this.add<Note>("notes", {
      id: newId("n"),
      commitmentId: input.commitmentId ?? null,
      checkInId: input.checkInId ?? null,
      createdAt: now(),
      ...input,
    });
  }

  /* ---------- benchmarks ---------- */
  async listBenchmarkEntries(userId: string) {
    return this.all<BenchmarkEntry>("benchmarkEntries")
      .filter((b) => b.userId === userId)
      .sort((a, b) => a.period.localeCompare(b.period));
  }
  async upsertBenchmarkEntry(input: Pick<BenchmarkEntry, "userId" | "period" | "metricKey" | "value">) {
    const existing = this.all<BenchmarkEntry>("benchmarkEntries").find(
      (b) => b.userId === input.userId && b.period === input.period && b.metricKey === input.metricKey,
    );
    if (existing) return this.patch<BenchmarkEntry>("benchmarkEntries", existing.id, { value: input.value });
    return this.add<BenchmarkEntry>("benchmarkEntries", { id: newId("bm"), createdAt: now(), ...input });
  }
  async cohortStats(metricKey: string): Promise<CohortStat | null> {
    const s = world.cohortStats[metricKey];
    if (!s || s.cohortSize < MIN_COHORT) return null;
    return { scope: "cohort", ...s };
  }

  /* ---------- challenges ---------- */
  async listChallenges() {
    return this.all<Challenge>("challenges").sort((a, b) => b.startDate.localeCompare(a.startDate));
  }
  async getChallenge(id: string) {
    return this.all<Challenge>("challenges").find((c) => c.id === id) ?? null;
  }
  async createChallenge(input: Pick<Challenge, "title" | "description" | "metricLabel" | "startDate" | "endDate">) {
    return this.add<Challenge>("challenges", { id: newId("ch"), createdAt: now(), ...input });
  }
  private participantRows() {
    return (this.all as unknown as (c: Collection) => (ChallengeParticipant & { id: string })[]).call(this, "participants");
  }
  async listParticipation(userId: string) {
    return this.participantRows().filter((p) => p.userId === userId);
  }
  async setParticipation(input: ChallengeParticipant) {
    const id = `${input.challengeId}:${input.userId}`;
    const existing = this.participantRows().find((p) => p.id === id);
    if (existing) return this.patch("participants", id, input);
    return this.add("participants", { id, ...input });
  }
  async leaderboard(challengeId: string): Promise<LeaderboardRow[]> {
    const profiles = this.all<Profile>("profiles");
    return this.participantRows()
      .filter((p) => p.challengeId === challengeId && p.leaderboardOptIn)
      .sort((a, b) => b.progress - a.progress)
      .map((p, i) => ({
        userId: p.userId,
        displayName: profiles.find((x) => x.id === p.userId)?.fullName ?? "A member",
        progress: p.progress,
        rank: i + 1,
      }));
  }

  /* ---------- templates ---------- */
  async listTemplates() {
    return [...world.templates].sort((a, b) => a.sort - b.sort);
  }
  async getTemplate(id: string) {
    return world.templates.find((t) => t.id === id) ?? null;
  }
}

/** Base rows need ids for the delta merge; circle members and participants use composite ids. */
export function prepareWorld() {
  const cm = world.circleMembers as Array<CircleMember & { id?: string }>;
  for (const m of cm) m.id ??= `${m.circleId}:${m.userId}`;
  const ps = world.participants as Array<ChallengeParticipant & { id?: string }>;
  for (const p of ps) p.id ??= `${p.challengeId}:${p.userId}`;
}
prepareWorld();

export { world, IDS, PERSONA_USER, type PersonaKey } from "./world";
