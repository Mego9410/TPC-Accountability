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

/**
 * The one door to the data. Pages and actions talk to this interface and
 * nothing else. There are two adapters: `demo` (a furnished world plus the
 * visitor's own changes, held in a session cookie) and `supabase` (the real
 * records once the Club is connected).
 */
export interface Repo {
  /* profiles */
  getProfile(id: string): Promise<Profile | null>;
  listProfiles(ids: string[]): Promise<Profile[]>;
  listAllProfiles(): Promise<Profile[]>;
  updateProfile(id: string, patch: Partial<Profile>): Promise<Profile>;

  /* circles */
  listCirclesFor(userId: string): Promise<CircleWithMembers[]>;
  getCircle(id: string): Promise<CircleWithMembers | null>;
  listAllCircles(): Promise<CircleWithMembers[]>;
  createCircle(input: Pick<Circle, "kind" | "name" | "cadence" | "cohortLabel">): Promise<Circle>;
  setCircleMember(circleId: string, userId: string, role: CircleRole | null): Promise<void>;

  /* sittings */
  listSittings(circleIds: string[]): Promise<Sitting[]>;
  getSitting(id: string): Promise<Sitting | null>;
  createSitting(input: Pick<Sitting, "circleId" | "scheduledAt" | "createdBy"> & { joinUrl?: string | null }): Promise<Sitting>;
  updateSitting(id: string, patch: Partial<Sitting>): Promise<Sitting>;

  /* blocks + commitments */
  listBlocks(userId: string): Promise<GoalBlock[]>;
  listBlocksFor(userIds: string[]): Promise<GoalBlock[]>;
  getBlock(id: string): Promise<GoalBlock | null>;
  createBlock(input: Pick<GoalBlock, "userId" | "title" | "description" | "startDate" | "templateId">): Promise<GoalBlock>;
  updateBlock(id: string, patch: Partial<GoalBlock>): Promise<GoalBlock>;
  listCommitments(blockId: string): Promise<Commitment[]>;
  listCommitmentsFor(userIds: string[]): Promise<Commitment[]>;
  createCommitment(input: Pick<Commitment, "blockId" | "userId" | "week" | "text"> & { carriedFrom?: string | null; sittingId?: string | null }): Promise<Commitment>;
  updateCommitment(id: string, patch: Partial<Commitment>): Promise<Commitment>;

  /* check-ins */
  listCheckIns(userId: string, limit?: number): Promise<CheckIn[]>;
  listCheckInsFor(userIds: string[], limit?: number): Promise<CheckIn[]>;
  createCheckIn(input: Omit<CheckIn, "id" | "completedAt">): Promise<CheckIn>;
  updateCheckIn(id: string, patch: Partial<CheckIn>): Promise<CheckIn>;

  /* wins */
  listWins(userId: string, includeArchived?: boolean): Promise<Win[]>;
  listWinsFor(userIds: string[]): Promise<Win[]>;
  createWin(input: Pick<Win, "userId" | "title" | "detail" | "blockId">): Promise<Win>;
  updateWin(id: string, patch: Partial<Win>): Promise<Win>;

  /* messages */
  listMessages(circleId: string): Promise<Message[]>;
  createMessage(input: Pick<Message, "circleId" | "senderId" | "body">): Promise<Message>;
  markRead(circleId: string, readerId: string): Promise<void>;
  countUnread(circleIds: string[], readerId: string): Promise<number>;

  /* mentor notes */
  listNotesAbout(userId: string): Promise<Note[]>;
  listNotesBy(authorId: string): Promise<Note[]>;
  createNote(input: Pick<Note, "authorId" | "aboutUserId" | "body"> & { commitmentId?: string | null; checkInId?: string | null }): Promise<Note>;

  /* benchmarks */
  listBenchmarkEntries(userId: string): Promise<BenchmarkEntry[]>;
  upsertBenchmarkEntry(input: Pick<BenchmarkEntry, "userId" | "period" | "metricKey" | "value">): Promise<BenchmarkEntry>;
  cohortStats(metricKey: string, period: string, region: string | null, practiceType: string | null): Promise<CohortStat | null>;

  /* challenges */
  listChallenges(): Promise<Challenge[]>;
  getChallenge(id: string): Promise<Challenge | null>;
  createChallenge(input: Pick<Challenge, "title" | "description" | "metricLabel" | "startDate" | "endDate">): Promise<Challenge>;
  listParticipation(userId: string): Promise<ChallengeParticipant[]>;
  setParticipation(input: ChallengeParticipant): Promise<ChallengeParticipant>;
  leaderboard(challengeId: string): Promise<LeaderboardRow[]>;

  /* templates */
  listTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | null>;

  /** Persist any pending changes (the demo adapter writes its cookie here). */
  flush(): Promise<void>;
}
