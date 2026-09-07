import type {
  Goal,
  GoalUpdate,
  Message,
  Partnership,
  Profile,
  Visit,
} from "@/lib/domain";

/**
 * The one door to the data. Pages and actions talk to this interface and
 * nothing else. Two adapters implement it: `demo` (a furnished world plus the
 * visitor's own changes, held in a session cookie) and `supabase`.
 */
export interface Repo {
  /* profiles */
  getProfile(id: string): Promise<Profile | null>;
  listProfiles(ids: string[]): Promise<Profile[]>;
  /** Everyone but the House. The members directory. */
  listMembers(): Promise<Profile[]>;
  updateProfile(id: string, patch: Partial<Profile>): Promise<Profile>;

  /* the partner */
  listPartnerships(userId: string): Promise<Partnership[]>;
  getPartnership(id: string): Promise<Partnership | null>;
  createPartnership(input: Pick<Partnership, "aId" | "bId" | "proposedById"> & { message?: string | null }): Promise<Partnership>;
  updatePartnership(id: string, patch: Partial<Partnership>): Promise<Partnership>;

  /* goals */
  listGoals(userIds: string[]): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | null>;
  createGoal(input: Pick<Goal, "userId" | "title"> & { detail?: string | null; targetDate?: string | null }): Promise<Goal>;
  updateGoal(id: string, patch: Partial<Goal>): Promise<Goal>;
  listGoalUpdates(goalIds: string[]): Promise<GoalUpdate[]>;
  createGoalUpdate(input: Pick<GoalUpdate, "goalId" | "authorId" | "body">): Promise<GoalUpdate>;

  /* visits */
  listVisitsFor(userId: string): Promise<Visit[]>;
  getVisit(id: string): Promise<Visit | null>;
  createVisit(input: Pick<Visit, "visitorId" | "hostId" | "proposedById" | "scheduledAt"> & {
    practiceName?: string | null;
    proposalNote?: string | null;
  }): Promise<Visit>;
  updateVisit(id: string, patch: Partial<Visit>): Promise<Visit>;

  /* correspondence */
  listMessagesWith(userId: string, otherId: string): Promise<Message[]>;
  listCorrespondents(userId: string): Promise<Message[]>;
  createMessage(input: Pick<Message, "fromId" | "toId" | "body">): Promise<Message>;
  markRead(userId: string, otherId: string): Promise<void>;
  countUnread(userId: string): Promise<number>;

  /** Persist any pending changes (the demo adapter writes its cookie here). */
  flush(): Promise<void>;
}
