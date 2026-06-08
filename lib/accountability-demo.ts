/**
 * Furnished demo data for the accountability area, shown during the "bypass"
 * tour (preview mode). Nothing here is persisted — it mirrors the shapes the
 * real pages query so the tour looks like a lived-in account.
 */
import { DEMO_USER_ID, demoPartner } from "@/lib/demo";
import { blockEndDate } from "@/lib/accountability";
import { monthPeriod } from "@/lib/benchmarks";
import type {
  BenchmarkEntry,
  Challenge,
  ChallengeParticipant,
  CheckIn,
  Commitment,
  GoalBlock,
  GoalBlockTemplate,
  Pod,
  Profile,
  TemplateCommitment,
  Win,
} from "@/lib/types";

export const DEMO_BLOCK_ID = "demo-block";
export const DEMO_COMPLETED_BLOCK_ID = "demo-block-done";
export const DEMO_POD_ID = "demo-pod";
export const DEMO_CHALLENGE_ID = "demo-challenge";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
function dateDaysAgo(days: number): string {
  return isoDaysAgo(days).slice(0, 10);
}
function monthsAgoPeriod(n: number): string {
  const d = new Date();
  return monthPeriod(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - n, 1)));
}

function makeProfile(
  id: string,
  fullName: string,
  practiceName: string,
  membershipNo: string,
  region: string,
): Profile {
  return {
    id,
    honorific: "Dr",
    full_name: fullName,
    practice_name: practiceName,
    location: region,
    timezone: "Europe/London",
    bio: null,
    avatar_url: null,
    membership_no: membershipNo,
    role: "principal",
    onboarded: true,
    region,
    practice_type: "Mixed",
    chair_count: 4,
    is_paid_member: true,
    reliability_score: 70,
    checkin_nudge_opt_out: false,
    created_at: isoDaysAgo(120),
    updated_at: isoDaysAgo(3),
  };
}

export const demoPodmateB = makeProfile(
  "demo-podmate-b",
  "Dr. Marcus Field",
  "Field Dental, Bristol",
  "0162",
  "Bristol",
);
export const demoPodmateC = makeProfile(
  "demo-podmate-c",
  "Dr. Priya Shah",
  "Shah & Associates, Manchester",
  "0168",
  "Manchester",
);

/* ---------- Goal blocks + commitments ---------- */
const blockStart = dateDaysAgo(28); // ~week 5

export const demoGoalBlock: GoalBlock = {
  id: DEMO_BLOCK_ID,
  user_id: DEMO_USER_ID,
  title: "Grow turnover to £150k per month",
  description: "A focused twelve weeks on treatment plan acceptance, hygiene recall and fee review.",
  start_date: blockStart,
  end_date: blockEndDate(blockStart),
  status: "active",
  created_at: isoDaysAgo(28),
};

export const demoCompletedBlock: GoalBlock = {
  id: DEMO_COMPLETED_BLOCK_ID,
  user_id: DEMO_USER_ID,
  title: "Get the diary under control",
  description: "Systems for a calmer week.",
  start_date: dateDaysAgo(150),
  end_date: dateDaysAgo(66),
  status: "completed",
  created_at: isoDaysAgo(150),
};

export const demoGoalBlocks: GoalBlock[] = [demoGoalBlock, demoCompletedBlock];

function commitment(
  id: string,
  week: number,
  text: string,
  status: Commitment["status"],
  carriedFrom: string | null = null,
): Commitment {
  return {
    id,
    goal_block_id: DEMO_BLOCK_ID,
    user_id: DEMO_USER_ID,
    week_number: week,
    text,
    status,
    carried_from: carriedFrom,
    created_at: isoDaysAgo(28 - week * 2),
  };
}

export const demoCommitments: Commitment[] = [
  commitment("dc-1", 1, "Audit treatment plan acceptance for the last quarter", "done"),
  commitment("dc-2", 1, "Brief the team on the twelve-week goal", "done"),
  commitment("dc-3", 2, "Introduce a structured treatment-plan follow-up call", "done"),
  commitment("dc-4", 2, "Review the hygiene recall list", "partial"),
  commitment("dc-5", 3, "Renegotiate the lab contract", "carried"),
  commitment("dc-6", 4, "Renegotiate the lab contract", "open", "dc-5"),
  commitment("dc-7", 4, "Benchmark fees against three local practices", "done"),
  commitment("dc-8", 5, "Set this week's TCO conversion target", "open"),
];

/* ---------- Check-ins ---------- */
function checkIn(
  id: string,
  userId: string,
  daysAgo: number,
  week: number | null,
  didWell: string,
  focus: string,
  energy: number,
): CheckIn {
  return {
    id,
    user_id: userId,
    pod_id: DEMO_POD_ID,
    week_number: week,
    did_well: didWell,
    struggled_with: null,
    next_week_focus: focus,
    energy_score: energy,
    completed_at: isoDaysAgo(daysAgo),
  };
}

export const demoCheckIns: CheckIn[] = [
  checkIn("ci-1", DEMO_USER_ID, 1, 5, "Acceptance up to 68% this week", "Lock in the fee review", 8),
  checkIn("ci-2", DEMO_USER_ID, 8, 4, "Hygiene recall list cleared", "Lab contract", 7),
  checkIn("ci-3", DEMO_USER_ID, 15, 3, "Team fully briefed and bought in", "Follow-up calls", 7),
  checkIn("ci-4", DEMO_USER_ID, 22, 2, "First follow-up calls booked", "Recall list", 6),
];

/* ---------- Pod + shared feed ---------- */
export const demoPod: Pod = {
  id: DEMO_POD_ID,
  name: "The Marylebone Six",
  cohort_label: "2026 Q3",
  status: "active",
  created_at: isoDaysAgo(60),
};

export const demoPodMembers = [
  { user_id: DEMO_USER_ID, role: "lead" as const },
  { user_id: demoPartner.id, role: "member" as const },
  { user_id: demoPodmateB.id, role: "member" as const },
  { user_id: demoPodmateC.id, role: "member" as const },
];

export const demoPodProfiles: Profile[] = [demoPartner, demoPodmateB, demoPodmateC];

export const demoPodFeed: CheckIn[] = [
  demoCheckIns[0],
  checkIn("ci-pa", demoPartner.id, 2, 5, "Made the associate offer — accepted", "Onboarding plan", 9),
  checkIn("ci-pb", demoPodmateB.id, 1, 5, "Hit 30 new patients this month", "Hygiene capacity", 7),
  checkIn("ci-pc", demoPodmateC.id, 3, 5, "Closed the quarter ahead of target", "Recruit a second TCO", 8),
];

/* ---------- Benchmarks ---------- */
function bench(metric: string, monthsAgo: number, value: number): BenchmarkEntry {
  return {
    id: `bm-${metric}-${monthsAgo}`,
    user_id: DEMO_USER_ID,
    period: monthsAgoPeriod(monthsAgo),
    metric_key: metric,
    metric_value: value,
    created_at: isoDaysAgo(monthsAgo * 30),
  };
}

export const demoBenchmarkEntries: BenchmarkEntry[] = [
  bench("monthly_turnover", 3, 118000),
  bench("monthly_turnover", 2, 126000),
  bench("monthly_turnover", 1, 131000),
  bench("monthly_turnover", 0, 140000),
  bench("hygiene_pct", 3, 14),
  bench("hygiene_pct", 2, 15),
  bench("hygiene_pct", 1, 16),
  bench("hygiene_pct", 0, 18),
  bench("new_patients", 1, 31),
  bench("new_patients", 0, 34),
];

export type DemoCohortStat = {
  scope: "cohort" | "club";
  cohort_size: number;
  median_value: number;
  p25: number;
  p75: number;
};

export const demoCohortStats: Record<string, DemoCohortStat> = {
  monthly_turnover: { scope: "cohort", cohort_size: 12, median_value: 122000, p25: 98000, p75: 145000 },
  hygiene_pct: { scope: "cohort", cohort_size: 12, median_value: 15, p25: 12, p75: 19 },
  new_patients: { scope: "cohort", cohort_size: 9, median_value: 29, p25: 22, p75: 36 },
};

/* ---------- Wins ---------- */
function win(id: string, daysAgo: number, title: string, detail: string | null): Win {
  return {
    id,
    user_id: DEMO_USER_ID,
    goal_block_id: DEMO_BLOCK_ID,
    title,
    detail,
    archived_at: null,
    created_at: isoDaysAgo(daysAgo),
  };
}

export const demoWins: Win[] = [
  win("w-1", 2, "Treatment plan acceptance crossed 68%", "Highest it has ever been."),
  win("w-2", 12, "Signed the new associate", "Two interviews, a clear yes."),
  win("w-3", 30, "Cleared the hygiene recall backlog", null),
];

/* ---------- Challenges ---------- */
export const demoChallenge: Challenge = {
  id: DEMO_CHALLENGE_ID,
  title: "The 90-day new-patient sprint",
  description: "Who can add the most new patients to their books in twelve weeks?",
  start_date: dateDaysAgo(20),
  end_date: dateDaysAgo(-64),
  created_at: isoDaysAgo(21),
};

export const demoMyParticipation: Pick<
  ChallengeParticipant,
  "challenge_id" | "progress" | "leaderboard_opt_in"
> = { challenge_id: DEMO_CHALLENGE_ID, progress: 34, leaderboard_opt_in: true };

export const demoLeaderboard = [
  { display_name: "Dr. Amara Adesanya", progress: 41, rank: 1 },
  { display_name: "Dr. Jordan Cheng", progress: 34, rank: 2 },
  { display_name: "Dr. Marcus Field", progress: 30, rank: 3 },
];

/* ---------- Templates ---------- */
export const demoTemplates: GoalBlockTemplate[] = [
  { id: "tpl-sale", slug: "sale-ready", title: "Get sale-ready in three years", description: "Lay the groundwork so the practice is an attractive, well-documented asset.", sort: 1, created_at: isoDaysAgo(90) },
  { id: "tpl-assoc", slug: "associate-days", title: "Add associate days", description: "Create the capacity, systems and patient flow to bring on an associate.", sort: 2, created_at: isoDaysAgo(90) },
  { id: "tpl-turnover", slug: "grow-turnover", title: "Grow turnover", description: "A focused twelve weeks on the levers that move monthly revenue.", sort: 3, created_at: isoDaysAgo(90) },
  { id: "tpl-tco", slug: "hire-tco", title: "Hire a treatment coordinator", description: "Define the role, recruit well, and embed a TCO into the patient journey.", sort: 4, created_at: isoDaysAgo(90) },
];

export const demoTemplateCommitments: TemplateCommitment[] = [
  { id: "tc-1", template_id: "tpl-turnover", week_number: 1, text: "Set the turnover target and the three levers to reach it", sort: 1 },
  { id: "tc-2", template_id: "tpl-turnover", week_number: 2, text: "Audit treatment plan acceptance and follow-up", sort: 2 },
  { id: "tc-3", template_id: "tpl-turnover", week_number: 4, text: "Introduce or refine hygiene recall", sort: 3 },
  { id: "tc-4", template_id: "tpl-sale", week_number: 1, text: "Commission an independent practice valuation", sort: 1 },
  { id: "tc-5", template_id: "tpl-sale", week_number: 2, text: "Document all systems and SOPs into one handbook", sort: 2 },
  { id: "tc-6", template_id: "tpl-assoc", week_number: 1, text: "Map current chair utilisation by day and surgery", sort: 1 },
  { id: "tc-7", template_id: "tpl-assoc", week_number: 2, text: "Define the associate role, days and remuneration", sort: 2 },
  { id: "tc-8", template_id: "tpl-tco", week_number: 1, text: "Write the TCO job description and success measures", sort: 1 },
  { id: "tc-9", template_id: "tpl-tco", week_number: 3, text: "Recruit — shortlist and interview", sort: 2 },
];
