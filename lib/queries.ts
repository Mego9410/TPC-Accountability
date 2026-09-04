import "server-only";
import type { CheckIn, CircleWithMembers, Commitment, GoalBlock, Profile, Sitting } from "@/lib/domain";
import type { Repo } from "@/lib/repo/types";
import { checkInStreak, clampWeek, consistencyScore, currentBlockWeek, currentWeekKey } from "@/lib/weeks";

/** Everything the home page, the mentor view and the circle need to say about one member's week. */
export interface MemberSnapshot {
  profile: Profile;
  block: GoalBlock | null;
  week: number | null;
  commitments: Commitment[];
  thisWeek: Commitment[];
  openThisWeek: number;
  keptThisWeek: number;
  checkIns: CheckIn[];
  latestCheckIn: CheckIn | null;
  checkedInThisWeek: boolean;
  streak: number;
  score: number;
  weekStatus: Partial<Record<number, "kept" | "mixed" | "missed" | "open" | "none">>;
}

export async function memberSnapshot(repo: Repo, profile: Profile): Promise<MemberSnapshot> {
  const [blocks, checkIns] = await Promise.all([repo.listBlocks(profile.id), repo.listCheckIns(profile.id, 60)]);
  const block = blocks.find((b) => b.status === "active") ?? null;
  const commitments = block ? await repo.listCommitments(block.id) : [];
  const week = block ? clampWeek(currentBlockWeek(block)) : null;
  const thisWeek = week ? commitments.filter((c) => c.week === week) : [];
  const weekKey = currentWeekKey();
  const streak = checkInStreak(checkIns);
  const score = consistencyScore({ block, commitments, checkInWeekKeys: new Set(checkIns.map((c) => c.weekKey)) });
  return {
    profile,
    block,
    week,
    commitments,
    thisWeek,
    openThisWeek: thisWeek.filter((c) => c.status === "open").length,
    keptThisWeek: thisWeek.filter((c) => c.status === "done").length,
    checkIns,
    latestCheckIn: checkIns[0] ?? null,
    checkedInThisWeek: checkIns.some((c) => c.weekKey === weekKey),
    streak,
    score,
    weekStatus: weekStatusMap(commitments, week ?? 0),
  };
}

export function weekStatusMap(commitments: Commitment[], current: number) {
  const out: MemberSnapshot["weekStatus"] = {};
  for (let w = 1; w <= 12; w += 1) {
    const cs = commitments.filter((c) => c.week === w && c.status !== "carried");
    if (cs.length === 0) { out[w] = "none"; continue; }
    if (w > current) { out[w] = "open"; continue; }
    const done = cs.filter((c) => c.status === "done").length;
    const missed = cs.filter((c) => c.status === "missed").length;
    const open = cs.filter((c) => c.status === "open").length;
    if (w === current && open > 0) out[w] = "open";
    else if (done === cs.length) out[w] = "kept";
    else if (missed === cs.length) out[w] = "missed";
    else out[w] = "mixed";
  }
  return out;
}

export async function nextSitting(repo: Repo, circles: CircleWithMembers[]): Promise<{ sitting: Sitting; circle: CircleWithMembers } | null> {
  const sittings = await repo.listSittings(circles.map((c) => c.id));
  const now = Date.now();
  const upcoming = sittings
    .filter((s) => s.status === "scheduled" && new Date(s.scheduledAt).getTime() > now - 3_600_000)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  if (!upcoming) return null;
  return { sitting: upcoming, circle: circles.find((c) => c.id === upcoming.circleId)! };
}

export function circleTitle(circle: CircleWithMembers, viewerId: string): string {
  if (circle.kind === "pod") return circle.name;
  const other = circle.members.find((m) => m.userId !== viewerId);
  return other ? other.profile.fullName : circle.name;
}
