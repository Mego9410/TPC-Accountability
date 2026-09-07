import "server-only";
import type { Goal, GoalUpdate, Message, Partnership, Profile, Visit } from "@/lib/domain";
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
 * The furnished example plus the visitor's own changes. Reads merge the base
 * world with the delta; writes go to the delta and are flushed to the cookie
 * at the end of the action. Nothing here reaches a server.
 */
export class DemoRepo implements Repo {
  private dirty = false;

  constructor(private delta: DemoDelta) {}

  get persona() {
    return this.delta.persona;
  }

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
  async listMembers() {
    return this.all<Profile>("profiles")
      .filter((p) => p.role !== "staff")
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
  async updateProfile(id: string, patch: Partial<Profile>) {
    return this.patch<Profile>("profiles", id, patch);
  }

  /* ---------- the partner ---------- */
  async listPartnerships(userId: string) {
    return this.all<Partnership>("partnerships")
      .filter((p) => p.aId === userId || p.bId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getPartnership(id: string) {
    return this.all<Partnership>("partnerships").find((p) => p.id === id) ?? null;
  }
  async createPartnership(input: Pick<Partnership, "aId" | "bId" | "proposedById"> & { message?: string | null }) {
    return this.add<Partnership>("partnerships", {
      id: newId("p"),
      status: "proposed",
      message: input.message ?? null,
      startedAt: null,
      endedAt: null,
      createdAt: now(),
      ...input,
    });
  }
  async updatePartnership(id: string, patch: Partial<Partnership>) {
    return this.patch<Partnership>("partnerships", id, patch);
  }

  /* ---------- goals ---------- */
  async listGoals(userIds: string[]) {
    const set = new Set(userIds);
    return this.all<Goal>("goals")
      .filter((g) => set.has(g.userId))
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "open" ? -1 : 1;
        return (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999");
      });
  }
  async getGoal(id: string) {
    return this.all<Goal>("goals").find((g) => g.id === id) ?? null;
  }
  async createGoal(input: Pick<Goal, "userId" | "title"> & { detail?: string | null; targetDate?: string | null }) {
    return this.add<Goal>("goals", {
      id: newId("g"),
      detail: input.detail ?? null,
      targetDate: input.targetDate ?? null,
      status: "open",
      doneAt: null,
      createdAt: now(),
      ...input,
    });
  }
  async updateGoal(id: string, patch: Partial<Goal>) {
    return this.patch<Goal>("goals", id, patch);
  }
  async listGoalUpdates(goalIds: string[]) {
    const set = new Set(goalIds);
    return this.all<GoalUpdate>("goalUpdates")
      .filter((u) => set.has(u.goalId) && u.body !== "")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async createGoalUpdate(input: Pick<GoalUpdate, "goalId" | "authorId" | "body">) {
    return this.add<GoalUpdate>("goalUpdates", { id: newId("gu"), createdAt: now(), ...input });
  }

  /* ---------- visits ---------- */
  async listVisitsFor(userId: string) {
    return this.all<Visit>("visits")
      .filter((v) => v.visitorId === userId || v.hostId === userId)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
  async getVisit(id: string) {
    return this.all<Visit>("visits").find((v) => v.id === id) ?? null;
  }
  async createVisit(input: Parameters<Repo["createVisit"]>[0]) {
    return this.add<Visit>("visits", {
      id: newId("v"),
      status: "proposed",
      practiceName: input.practiceName ?? null,
      proposalNote: input.proposalNote ?? null,
      arrivalNote: null,
      notes: null,
      createdAt: now(),
      ...input,
    });
  }
  async updateVisit(id: string, patch: Partial<Visit>) {
    return this.patch<Visit>("visits", id, patch);
  }

  /* ---------- correspondence ---------- */
  async listMessagesWith(userId: string, otherId: string) {
    return this.all<Message>("messages")
      .filter(
        (m) =>
          (m.fromId === userId && m.toId === otherId) || (m.fromId === otherId && m.toId === userId),
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async listCorrespondents(userId: string) {
    return this.all<Message>("messages")
      .filter((m) => m.fromId === userId || m.toId === userId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async createMessage(input: Pick<Message, "fromId" | "toId" | "body">) {
    return this.add<Message>("messages", { id: newId("m"), readAt: null, createdAt: now(), ...input });
  }
  async markRead(userId: string, otherId: string) {
    for (const m of this.all<Message>("messages")) {
      if (m.toId === userId && m.fromId === otherId && !m.readAt) {
        this.patch<Message>("messages", m.id, { readAt: now() });
      }
    }
  }
  async countUnread(userId: string) {
    return this.all<Message>("messages").filter((m) => m.toId === userId && !m.readAt).length;
  }
}

export { world, IDS, PERSONA_USER, type PersonaKey } from "./world";
