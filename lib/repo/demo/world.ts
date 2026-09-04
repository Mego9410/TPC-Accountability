/**
 * The furnished example. A small, coherent world of UK principals so the tour
 * looks like a lived-in Club: one pair (mentor + mentee), one pod, two
 * mentors, a handful of members, the House.
 *
 * Dates are relative to "now" so the demo never goes stale.
 */
import type {
  BenchmarkEntry,
  Challenge,
  ChallengeParticipant,
  CheckIn,
  Circle,
  CircleMember,
  Commitment,
  GoalBlock,
  Message,
  Note,
  Profile,
  Sitting,
  Template,
  Win,
} from "@/lib/domain";
import { blockEndDate, isoWeekKey } from "@/lib/weeks";
import { monthsAgoPeriod } from "@/lib/benchmarks";

export const IDS = {
  cheng: "u-cheng",
  adesanya: "u-adesanya",
  field: "u-field",
  shah: "u-shah",
  hart: "u-hart",
  delaney: "u-delaney",
  okafor: "u-okafor",
  house: "u-house",
  pairCheng: "c-pair-cheng",
  pairDelaney: "c-pair-delaney",
  pod: "c-pod-marylebone",
  blockCheng: "b-cheng-turnover",
  blockChengDone: "b-cheng-diary",
  blockDelaney: "b-delaney-tco",
  blockField: "b-field-np",
  blockShah: "b-shah-assoc",
  blockHart: "b-hart-sale",
  blockAdesanya: "b-adesanya-second-site",
  challenge: "ch-new-patients",
} as const;

export type PersonaKey = "member" | "mentor" | "house";
export const PERSONA_USER: Record<PersonaKey, string> = {
  member: IDS.cheng,
  mentor: IDS.adesanya,
  house: IDS.house,
};

function iso(daysFromNow: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function day(daysFromNow: number): string {
  return iso(daysFromNow).slice(0, 10);
}
function wk(daysAgo: number): string {
  return isoWeekKey(new Date(iso(-daysAgo)));
}

/* ---------- Profiles ---------- */
function profile(p: Partial<Profile> & Pick<Profile, "id" | "fullName" | "membershipNo">): Profile {
  return {
    honorific: "Dr",
    email: null,
    practiceName: null,
    region: null,
    practiceType: null,
    chairCount: null,
    yearsAsPrincipal: null,
    timezone: "Europe/London",
    bio: null,
    role: "member",
    tier: "society",
    onboarded: true,
    focusAreas: [],
    cadence: "fortnightly",
    preferredTimes: ["Evenings"],
    mentorCapacity: null,
    mentorNote: null,
    consistencyScore: 70,
    nudgeOptOut: false,
    createdAt: iso(-120),
    ...p,
  };
}

export const profiles: Profile[] = [
  profile({
    id: IDS.cheng,
    fullName: "Dr Jordan Cheng",
    email: "jordan@chengdental.co.uk",
    practiceName: "Cheng Dental, Marylebone",
    region: "London",
    practiceType: "Mixed",
    chairCount: 4,
    yearsAsPrincipal: 3,
    bio: "Two surgeries in central London. Working towards a treatment coordinator model and a calmer week.",
    membershipNo: "0149",
    focusAreas: ["Treatment plan conversion", "Team and culture", "Work and life in balance"],
    consistencyScore: 82,
    createdAt: iso(-120),
  }),
  profile({
    id: IDS.adesanya,
    fullName: "Dr Amara Adesanya",
    email: "amara@adesanyadental.co.uk",
    practiceName: "Adesanya Dental, Leeds",
    region: "Yorkshire and the Humber",
    practiceType: "Private",
    chairCount: 6,
    yearsAsPrincipal: 14,
    bio: "Bought a single-surgery practice in 2012 and grew it to six chairs and an associate team. Sold a second site in 2024.",
    membershipNo: "0151",
    role: "mentor",
    mentorCapacity: 4,
    mentorNote: "I ask a lot of questions and very rarely give advice. If you want someone to tell you what to do, I am the wrong mentor.",
    focusAreas: ["Recruitment", "Acquisition or expansion", "Preparing to sell"],
    consistencyScore: 91,
    createdAt: iso(-400),
  }),
  profile({
    id: IDS.field,
    fullName: "Dr Marcus Field",
    practiceName: "Field Dental, Clifton",
    region: "South West",
    practiceType: "Mixed",
    chairCount: 3,
    yearsAsPrincipal: 5,
    membershipNo: "0162",
    focusAreas: ["New patient growth", "Financial performance"],
    consistencyScore: 74,
    createdAt: iso(-90),
  }),
  profile({
    id: IDS.shah,
    fullName: "Dr Priya Shah",
    practiceName: "Shah & Associates, Didsbury",
    region: "North West",
    practiceType: "Private",
    chairCount: 5,
    yearsAsPrincipal: 8,
    membershipNo: "0168",
    focusAreas: ["Recruitment", "Clinical systems and quality"],
    consistencyScore: 88,
    createdAt: iso(-85),
  }),
  profile({
    id: IDS.hart,
    fullName: "Dr Eleanor Hart",
    practiceName: "Hart Dental Care, Stockbridge",
    region: "Scotland",
    practiceType: "NHS",
    chairCount: 4,
    yearsAsPrincipal: 11,
    membershipNo: "0171",
    focusAreas: ["Preparing to sell", "Work and life in balance"],
    consistencyScore: 66,
    createdAt: iso(-95),
  }),
  profile({
    id: IDS.delaney,
    fullName: "Dr Sam Delaney",
    email: "sam@delaneydental.co.uk",
    practiceName: "Delaney Dental, Ecclesall",
    region: "Yorkshire and the Humber",
    practiceType: "Mixed",
    chairCount: 2,
    yearsAsPrincipal: 1,
    bio: "First year as a principal after buying my associate practice. Learning fast, mostly the hard way.",
    membershipNo: "0177",
    focusAreas: ["Recruitment", "Financial performance", "Team and culture"],
    consistencyScore: 58,
    createdAt: iso(-45),
  }),
  profile({
    id: IDS.okafor,
    fullName: "Dr Chidi Okafor",
    practiceName: "Okafor Dental Group, Solihull",
    region: "West Midlands",
    practiceType: "Private",
    chairCount: 9,
    yearsAsPrincipal: 19,
    bio: "Three sites. Interested in mentoring principals in their first five years.",
    membershipNo: "0130",
    role: "mentor",
    mentorCapacity: 3,
    mentorNote: "I will be direct. I mentor on numbers first and feelings second.",
    focusAreas: ["Acquisition or expansion", "Financial performance"],
    consistencyScore: 84,
    createdAt: iso(-500),
  }),
  profile({
    id: IDS.house,
    honorific: "",
    fullName: "The House",
    email: "house@principalsclub.co.uk",
    membershipNo: "0001",
    role: "staff",
    consistencyScore: 0,
    createdAt: iso(-600),
  }),
];

/* ---------- Circles ---------- */
export const circles: Circle[] = [
  { id: IDS.pairCheng, kind: "pair", name: "Cheng · Adesanya", cadence: "fortnightly", cohortLabel: null, status: "active", createdAt: iso(-90) },
  { id: IDS.pairDelaney, kind: "pair", name: "Delaney · Adesanya", cadence: "weekly", cohortLabel: null, status: "active", createdAt: iso(-40) },
  { id: IDS.pod, kind: "pod", name: "The Marylebone Six", cadence: "monthly", cohortLabel: "2026 Q3", status: "active", createdAt: iso(-80) },
];

export const circleMembers: CircleMember[] = [
  { circleId: IDS.pairCheng, userId: IDS.cheng, role: "mentee", joinedAt: iso(-90) },
  { circleId: IDS.pairCheng, userId: IDS.adesanya, role: "mentor", joinedAt: iso(-90) },
  { circleId: IDS.pairDelaney, userId: IDS.delaney, role: "mentee", joinedAt: iso(-40) },
  { circleId: IDS.pairDelaney, userId: IDS.adesanya, role: "mentor", joinedAt: iso(-40) },
  { circleId: IDS.pod, userId: IDS.adesanya, role: "lead", joinedAt: iso(-80) },
  { circleId: IDS.pod, userId: IDS.cheng, role: "peer", joinedAt: iso(-80) },
  { circleId: IDS.pod, userId: IDS.field, role: "peer", joinedAt: iso(-80) },
  { circleId: IDS.pod, userId: IDS.shah, role: "peer", joinedAt: iso(-80) },
  { circleId: IDS.pod, userId: IDS.hart, role: "peer", joinedAt: iso(-78) },
  { circleId: IDS.pod, userId: IDS.delaney, role: "peer", joinedAt: iso(-40) },
];

/* ---------- Sittings ----------
   A sitting is held over video or inside somebody's practice. Every principal
   visits every other principal in their circle, and has each of them inside
   their own practice in turn; those mornings are `kind: "visit"`. */
function video(s: Omit<Sitting, "kind" | "hostId" | "location">): Sitting {
  return { ...s, kind: "video", hostId: null, location: null };
}
function visit(s: Omit<Sitting, "kind" | "joinUrl"> & { hostId: string; location: string }): Sitting {
  return { ...s, kind: "visit", joinUrl: null };
}

export const sittings: Sitting[] = [
  video({
    id: "s-cheng-past-2",
    circleId: IDS.pairCheng,
    scheduledAt: iso(-32, 18, 30),
    status: "completed",
    joinUrl: null,
    notes: "Agreed the twelve-week turnover block. Jordan to audit acceptance for the last quarter before the next sitting.",
    createdBy: IDS.adesanya,
    createdAt: iso(-46),
  }),
  video({
    id: "s-cheng-past",
    circleId: IDS.pairCheng,
    scheduledAt: iso(-18, 18, 30),
    status: "completed",
    joinUrl: null,
    notes: "Acceptance is at 64%, up from 60. The lab contract is the sticking point: Jordan has been putting the call off. Agreed it carries to next week with a date in the diary.",
    createdBy: IDS.adesanya,
    createdAt: iso(-32),
  }),
  video({
    id: "s-cheng-next",
    circleId: IDS.pairCheng,
    scheduledAt: iso(9, 18, 30),
    status: "scheduled",
    joinUrl: "https://meet.google.com/tpc-cheng-adesanya",
    notes: null,
    createdBy: IDS.adesanya,
    createdAt: iso(-18),
  }),
  video({
    id: "s-delaney-next",
    circleId: IDS.pairDelaney,
    scheduledAt: iso(2, 7, 30),
    status: "scheduled",
    joinUrl: "https://meet.google.com/tpc-delaney-adesanya",
    notes: null,
    createdBy: IDS.adesanya,
    createdAt: iso(-5),
  }),
  video({
    id: "s-delaney-past",
    circleId: IDS.pairDelaney,
    scheduledAt: iso(-5, 7, 30),
    status: "completed",
    joinUrl: null,
    notes: "Sam has written the TCO job description. Next: agree the salary band and post it.",
    createdBy: IDS.adesanya,
    createdAt: iso(-12),
  }),
  video({
    id: "s-pod-next",
    circleId: IDS.pod,
    scheduledAt: iso(5, 19, 0),
    status: "scheduled",
    joinUrl: "https://meet.google.com/tpc-marylebone-six",
    notes: null,
    createdBy: IDS.adesanya,
    createdAt: iso(-25),
  }),
  video({
    id: "s-pod-past",
    circleId: IDS.pod,
    scheduledAt: iso(-25, 19, 0),
    status: "completed",
    joinUrl: null,
    notes: "Round the table on recruitment. Priya's associate interview questions shared with the pod.",
    createdBy: IDS.adesanya,
    createdAt: iso(-55),
  }),

  /* Practice visits */
  visit({
    id: "s-visit-adesanya",
    circleId: IDS.pairCheng,
    scheduledAt: iso(-40, 8, 30),
    status: "completed",
    hostId: IDS.adesanya,
    location: "Adesanya Dental, Leeds",
    notes: "Amara's huddle runs to nine minutes and everyone stands. Ours runs to twenty and everyone sits. Changing it on Monday.",
    createdBy: IDS.adesanya,
    createdAt: iso(-62),
  }),
  visit({
    id: "s-visit-cheng",
    circleId: IDS.pairCheng,
    scheduledAt: iso(21, 8, 30),
    status: "scheduled",
    hostId: IDS.cheng,
    location: "Cheng Dental, Marylebone",
    notes: null,
    createdBy: IDS.cheng,
    createdAt: iso(-11),
  }),
  visit({
    id: "s-visit-shah",
    circleId: IDS.pod,
    scheduledAt: iso(-70, 9, 0),
    status: "completed",
    hostId: IDS.shah,
    location: "Shah & Associates, Didsbury",
    notes: "Six of us in Didsbury for the morning. Priya runs two hygienists off one nurse and the diary never breaks. Marcus counted eleven minutes between patients; we average nineteen.",
    createdBy: IDS.adesanya,
    createdAt: iso(-95),
  }),
];

/* ---------- Blocks ---------- */
const chengStart = day(-28); // week 5
const delaneyStart = day(-14); // week 3
const fieldStart = day(-35);
const shahStart = day(-42);
const hartStart = day(-21);
const adesanyaStart = day(-49);

export const blocks: GoalBlock[] = [
  { id: IDS.blockCheng, userId: IDS.cheng, title: "Grow turnover to £150k a month", description: "Twelve weeks on treatment plan acceptance, hygiene recall and a fee review.", startDate: chengStart, endDate: blockEndDate(chengStart), status: "active", templateId: "t-turnover", createdAt: iso(-28) },
  { id: IDS.blockChengDone, userId: IDS.cheng, title: "Get the diary under control", description: "Systems for a calmer week.", startDate: day(-150), endDate: day(-66), status: "completed", templateId: null, createdAt: iso(-150) },
  { id: IDS.blockDelaney, userId: IDS.delaney, title: "Hire a treatment coordinator", description: "Define the role, recruit well, and embed a TCO into the patient journey.", startDate: delaneyStart, endDate: blockEndDate(delaneyStart), status: "active", templateId: "t-tco", createdAt: iso(-14) },
  { id: IDS.blockField, userId: IDS.field, title: "Forty new patients a month", description: null, startDate: fieldStart, endDate: blockEndDate(fieldStart), status: "active", templateId: null, createdAt: iso(-35) },
  { id: IDS.blockShah, userId: IDS.shah, title: "Add two associate days", description: null, startDate: shahStart, endDate: blockEndDate(shahStart), status: "active", templateId: "t-associate", createdAt: iso(-42) },
  { id: IDS.blockHart, userId: IDS.hart, title: "Get sale-ready in three years", description: "Year one of three.", startDate: hartStart, endDate: blockEndDate(hartStart), status: "active", templateId: "t-sale", createdAt: iso(-21) },
  { id: IDS.blockAdesanya, userId: IDS.adesanya, title: "Open the second site by spring", description: "Lease, fit-out, and a lead clinician.", startDate: adesanyaStart, endDate: blockEndDate(adesanyaStart), status: "active", templateId: null, createdAt: iso(-49) },
];

/* ---------- Commitments ---------- */
let cN = 0;
function c(blockId: string, userId: string, week: number, text: string, status: Commitment["status"], extra: Partial<Commitment> = {}): Commitment {
  cN += 1;
  return { id: `cm-${cN}`, blockId, userId, week, text, status, carriedFrom: null, sittingId: null, createdAt: iso(-60 + week * 7), ...extra };
}

export const commitments: Commitment[] = [
  // Cheng, week 5 of 12
  c(IDS.blockCheng, IDS.cheng, 1, "Audit treatment plan acceptance for the last quarter", "done", { sittingId: "s-cheng-past-2" }),
  c(IDS.blockCheng, IDS.cheng, 1, "Brief the team on the twelve-week goal", "done"),
  c(IDS.blockCheng, IDS.cheng, 2, "Introduce a structured treatment-plan follow-up call", "done"),
  c(IDS.blockCheng, IDS.cheng, 2, "Review the hygiene recall list", "partial"),
  c(IDS.blockCheng, IDS.cheng, 3, "Renegotiate the lab contract", "carried", { sittingId: "s-cheng-past" }),
  c(IDS.blockCheng, IDS.cheng, 3, "Shadow the TCO on three consultations", "missed"),
  c(IDS.blockCheng, IDS.cheng, 4, "Renegotiate the lab contract", "open", { carriedFrom: "cm-5" }),
  c(IDS.blockCheng, IDS.cheng, 4, "Benchmark fees against three local practices", "done"),
  c(IDS.blockCheng, IDS.cheng, 5, "Set this week's TCO conversion target", "open"),
  c(IDS.blockCheng, IDS.cheng, 5, "Book the fee review meeting with the accountant", "open"),
  // Cheng, completed block
  c(IDS.blockChengDone, IDS.cheng, 1, "Map a typical week hour by hour", "done"),
  c(IDS.blockChengDone, IDS.cheng, 3, "Block admin time on Wednesday afternoons", "done"),
  c(IDS.blockChengDone, IDS.cheng, 6, "Hand the recall calls to reception", "done"),
  c(IDS.blockChengDone, IDS.cheng, 9, "Take a full week off without checking email", "partial"),
  c(IDS.blockChengDone, IDS.cheng, 12, "Write the new diary rules into the handbook", "done"),
  // Delaney, week 3
  c(IDS.blockDelaney, IDS.delaney, 1, "Write the TCO job description and success measures", "done"),
  c(IDS.blockDelaney, IDS.delaney, 2, "Agree the salary band with the accountant", "done"),
  c(IDS.blockDelaney, IDS.delaney, 2, "Post the role on two boards", "missed"),
  c(IDS.blockDelaney, IDS.delaney, 3, "Post the role on two boards", "open", { carriedFrom: "cm-18" }),
  c(IDS.blockDelaney, IDS.delaney, 3, "Shortlist and book first interviews", "open"),
  // Field
  c(IDS.blockField, IDS.field, 5, "Launch the Google Ads trial", "done"),
  c(IDS.blockField, IDS.field, 6, "Call every new patient the day after their first visit", "open"),
  // Shah
  c(IDS.blockShah, IDS.shah, 6, "Interview the two shortlisted associates", "done"),
  c(IDS.blockShah, IDS.shah, 7, "Make the offer", "open"),
  // Hart
  c(IDS.blockHart, IDS.hart, 3, "Commission an independent valuation", "done"),
  c(IDS.blockHart, IDS.hart, 4, "Start the systems handbook", "partial"),
  // Adesanya
  c(IDS.blockAdesanya, IDS.adesanya, 7, "Sign the lease", "done"),
  c(IDS.blockAdesanya, IDS.adesanya, 8, "Appoint the fit-out contractor", "open"),
];

/* ---------- Check-ins ---------- */
let ciN = 0;
function ci(userId: string, daysAgo: number, blockWeek: number | null, didWell: string, struggled: string | null, next: string, energy: number, circleId: string | null = IDS.pod): CheckIn {
  ciN += 1;
  return { id: `ci-${ciN}`, userId, circleId, weekKey: wk(daysAgo), blockWeek, didWell, struggledWith: struggled, nextFocus: next, energy, completedAt: iso(-daysAgo, 20, 15) };
}

export const checkIns: CheckIn[] = [
  ci(IDS.cheng, 8, 4, "Acceptance up to 68% this week. Fees benchmarked.", "Still have not made the lab call.", "The lab call, and a date for the fee review.", 8),
  ci(IDS.cheng, 15, 3, "Team fully briefed and bought in.", "Missed the TCO shadowing; too many clinical days.", "Follow-up calls and the recall list.", 7),
  ci(IDS.cheng, 22, 2, "First follow-up calls booked.", null, "Clear the recall list.", 6),
  ci(IDS.cheng, 29, 1, "Audit done. Acceptance is 60%, lower than I thought.", "Facing the number.", "Brief the team.", 6),
  ci(IDS.adesanya, 2, 8, "Lease signed. Fit-out tenders back.", null, "Appoint the contractor.", 8),
  ci(IDS.field, 1, 6, "Thirty-four new patients this month, best ever.", "Ads spend is higher than I would like.", "Day-after calls.", 7),
  ci(IDS.shah, 3, 7, "Both interviews done. One clear favourite.", null, "Make the offer before Friday.", 8),
  ci(IDS.hart, 2, 4, "Valuation back: higher than expected.", "The handbook is a slog.", "Two SOPs a week.", 5),
  ci(IDS.delaney, 1, 3, "Salary band agreed.", "Did not post the role. Nervous about the cost.", "Post it. Just post it.", 5),
  ci(IDS.delaney, 8, 2, "JD written and signed off by Amara.", null, "Salary band.", 6),
];

/* ---------- Wins ---------- */
let wN = 0;
function w(userId: string, blockId: string | null, daysAgo: number, title: string, detail: string | null): Win {
  wN += 1;
  return { id: `w-${wN}`, userId, blockId, title, detail, archivedAt: null, createdAt: iso(-daysAgo, 12) };
}
export const wins: Win[] = [
  w(IDS.cheng, IDS.blockCheng, 2, "Treatment plan acceptance crossed 68%", "Highest it has ever been."),
  w(IDS.cheng, IDS.blockCheng, 12, "Fees benchmarked against three practices", "We are under-priced on hygiene by about 15%."),
  w(IDS.cheng, IDS.blockChengDone, 80, "Took a full week off", "Checked email twice. Progress."),
  w(IDS.cheng, IDS.blockChengDone, 110, "Cleared the hygiene recall backlog", null),
  w(IDS.delaney, IDS.blockDelaney, 6, "First job description I have ever written", "Amara made me cut it in half."),
  w(IDS.adesanya, IDS.blockAdesanya, 3, "Lease signed on the second site", "Eighteen months of looking."),
  w(IDS.shah, IDS.blockShah, 4, "Two strong associate candidates", null),
];

/* ---------- Messages ---------- */
let mN = 0;
function m(circleId: string, senderId: string, daysAgo: number, hour: number, body: string, read = true): Message {
  mN += 1;
  return { id: `m-${mN}`, circleId, senderId, body, readAt: read ? iso(-daysAgo, hour + 1) : null, createdAt: iso(-daysAgo, hour) };
}
export const messages: Message[] = [
  m(IDS.pairCheng, IDS.adesanya, 17, 9, "Good sitting last night. Put the lab call in the diary today, not tomorrow."),
  m(IDS.pairCheng, IDS.cheng, 17, 12, "Done. Thursday at two. I have the last three invoices in front of me."),
  m(IDS.pairCheng, IDS.adesanya, 9, 8, "How did Thursday go?"),
  m(IDS.pairCheng, IDS.cheng, 9, 21, "It did not. Their account manager was off. Rebooked for next week and I am annoyed with myself."),
  m(IDS.pairCheng, IDS.adesanya, 1, 7, "Annoyed is fine. Carried is fine. Not doing it twice is the thing to avoid. Bring the number to our sitting.", false),
  m(IDS.pod, IDS.shah, 4, 13, "For anyone recruiting: the associate interview questions from last month are in the shared folder."),
  m(IDS.pod, IDS.field, 3, 18, "Thank you Priya. Used two of them today."),
  m(IDS.pod, IDS.adesanya, 2, 8, "Reminder that we sit on the 9th at seven. Bring one number you are proud of and one you are not.", false),
  m(IDS.pairDelaney, IDS.delaney, 1, 22, "I still have not posted the role. I know."),
  m(IDS.pairDelaney, IDS.adesanya, 0, 7, "Post it before our sitting tomorrow and we will spend the time on the interviews instead of on why you have not.", false),
];

/* ---------- Mentor notes ---------- */
export const notes: Note[] = [
  { id: "n-1", authorId: IDS.adesanya, aboutUserId: IDS.cheng, commitmentId: "cm-7", checkInId: null, body: "Second week carried. If it slips again, ask whether it is the wrong commitment rather than a lack of will.", createdAt: iso(-8, 9) },
  { id: "n-2", authorId: IDS.adesanya, aboutUserId: IDS.cheng, commitmentId: null, checkInId: null, body: "Acceptance moving faster than expected. Consider raising the block target at week six.", createdAt: iso(-3, 9) },
  { id: "n-3", authorId: IDS.adesanya, aboutUserId: IDS.delaney, commitmentId: "cm-19", checkInId: null, body: "The fear is about the cost, not the posting. Bring the numbers to the sitting.", createdAt: iso(-1, 9) },
];

/* ---------- Benchmarks ---------- */
let bN = 0;
function b(userId: string, metricKey: string, monthsAgo: number, value: number): BenchmarkEntry {
  bN += 1;
  return { id: `bm-${bN}`, userId, period: monthsAgoPeriod(monthsAgo), metricKey, value, createdAt: iso(-monthsAgo * 30) };
}
export const benchmarkEntries: BenchmarkEntry[] = [
  b(IDS.cheng, "monthly_turnover", 5, 112000),
  b(IDS.cheng, "monthly_turnover", 4, 115000),
  b(IDS.cheng, "monthly_turnover", 3, 118000),
  b(IDS.cheng, "monthly_turnover", 2, 126000),
  b(IDS.cheng, "monthly_turnover", 1, 131000),
  b(IDS.cheng, "monthly_turnover", 0, 140000),
  b(IDS.cheng, "hygiene_pct", 3, 14),
  b(IDS.cheng, "hygiene_pct", 2, 15),
  b(IDS.cheng, "hygiene_pct", 1, 16),
  b(IDS.cheng, "hygiene_pct", 0, 18),
  b(IDS.cheng, "treatment_acceptance_pct", 2, 60),
  b(IDS.cheng, "treatment_acceptance_pct", 1, 64),
  b(IDS.cheng, "treatment_acceptance_pct", 0, 68),
  b(IDS.cheng, "new_patients", 1, 31),
  b(IDS.cheng, "new_patients", 0, 34),
  b(IDS.adesanya, "monthly_turnover", 1, 244000),
  b(IDS.adesanya, "monthly_turnover", 0, 251000),
  b(IDS.adesanya, "hygiene_pct", 0, 22),
  b(IDS.delaney, "monthly_turnover", 1, 48000),
  b(IDS.delaney, "monthly_turnover", 0, 52000),
];

/** Cohort bands keyed by metric. The demo is generous: every cohort is above the floor. */
export const cohortStats: Record<string, { cohortSize: number; median: number; p25: number; p75: number }> = {
  monthly_turnover: { cohortSize: 12, median: 122000, p25: 98000, p75: 145000 },
  hygiene_pct: { cohortSize: 12, median: 15, p25: 12, p75: 19 },
  treatment_acceptance_pct: { cohortSize: 9, median: 62, p25: 55, p75: 71 },
  new_patients: { cohortSize: 9, median: 29, p25: 22, p75: 36 },
  chair_utilisation_pct: { cohortSize: 7, median: 74, p25: 66, p75: 82 },
};

/* ---------- Challenges ---------- */
export const challenges: Challenge[] = [
  { id: IDS.challenge, title: "The ninety-day new-patient sprint", description: "New patients seen for the first time, counted from the start of the sprint.", metricLabel: "new patients", startDate: day(-20), endDate: day(70), createdAt: iso(-21) },
];
export const participants: ChallengeParticipant[] = [
  { challengeId: IDS.challenge, userId: IDS.adesanya, progress: 41, leaderboardOptIn: true },
  { challengeId: IDS.challenge, userId: IDS.cheng, progress: 34, leaderboardOptIn: true },
  { challengeId: IDS.challenge, userId: IDS.field, progress: 30, leaderboardOptIn: true },
  { challengeId: IDS.challenge, userId: IDS.shah, progress: 22, leaderboardOptIn: false },
  { challengeId: IDS.challenge, userId: IDS.delaney, progress: 9, leaderboardOptIn: true },
];

/* ---------- Templates ---------- */
export const templates: Template[] = [
  {
    id: "t-turnover", slug: "grow-turnover", title: "Grow turnover", audience: "any", sort: 1,
    description: "A focused twelve weeks on the three levers that move monthly revenue: acceptance, hygiene, fees.",
    weeks: [
      { week: 1, text: "Set the turnover target and name the three levers to reach it" },
      { week: 1, text: "Brief the team on the twelve-week goal" },
      { week: 2, text: "Audit treatment plan acceptance for the last quarter" },
      { week: 3, text: "Introduce a structured treatment-plan follow-up call" },
      { week: 4, text: "Benchmark fees against three local practices" },
      { week: 5, text: "Review the hygiene recall list and clear the backlog" },
      { week: 6, text: "Hold the fee review with the accountant" },
      { week: 8, text: "Introduce the new fee guide" },
      { week: 10, text: "Review acceptance against week two" },
      { week: 12, text: "Write up what moved and what did not" },
    ],
  },
  {
    id: "t-tco", slug: "hire-tco", title: "Hire a treatment coordinator", audience: "mentee", sort: 2,
    description: "Define the role, recruit well, and embed a TCO into the patient journey.",
    weeks: [
      { week: 1, text: "Write the TCO job description and success measures" },
      { week: 2, text: "Agree the salary band with the accountant" },
      { week: 2, text: "Post the role on two boards" },
      { week: 3, text: "Shortlist and book first interviews" },
      { week: 5, text: "Make the offer" },
      { week: 7, text: "Map the patient journey with the TCO in it" },
      { week: 9, text: "First month review: acceptance before and after" },
      { week: 12, text: "Decide whether the role is working and what to change" },
    ],
  },
  {
    id: "t-associate", slug: "associate-days", title: "Add associate days", audience: "any", sort: 3,
    description: "Create the capacity, systems and patient flow to bring on an associate.",
    weeks: [
      { week: 1, text: "Map current chair utilisation by day and surgery" },
      { week: 2, text: "Define the associate role, days and remuneration" },
      { week: 3, text: "Advertise and brief two recruiters" },
      { week: 5, text: "Interview the shortlist" },
      { week: 6, text: "Make the offer" },
      { week: 9, text: "Build the associate's diary six weeks out" },
      { week: 12, text: "Review utilisation against week one" },
    ],
  },
  {
    id: "t-sale", slug: "sale-ready", title: "Get sale-ready in three years", audience: "any", sort: 4,
    description: "Year one of three: make the practice a documented, transferable asset.",
    weeks: [
      { week: 1, text: "Commission an independent practice valuation" },
      { week: 2, text: "Start the systems handbook: one SOP a week from here" },
      { week: 4, text: "Review the lease and any change-of-control clauses" },
      { week: 6, text: "Separate owner-dependent income from practice income" },
      { week: 8, text: "Tidy the accounts: three clean years is the target" },
      { week: 12, text: "Meet a broker for an informal view" },
    ],
  },
  {
    id: "t-first-year", slug: "first-year", title: "The first year as a principal", audience: "mentee", sort: 5,
    description: "For new owners: the twelve things that stop the wheels coming off.",
    weeks: [
      { week: 1, text: "Know the daily break-even figure" },
      { week: 2, text: "Meet every team member one to one" },
      { week: 3, text: "Write down the three things only you can do" },
      { week: 5, text: "Hand one of them to someone else" },
      { week: 7, text: "Agree a monthly numbers review with the accountant" },
      { week: 9, text: "Take a whole weekend off" },
      { week: 12, text: "Write the letter you wish you had received in week one" },
    ],
  },
];

export const world = {
  profiles, circles, circleMembers, sittings, blocks, commitments, checkIns, wins, messages, notes,
  benchmarkEntries, cohortStats, challenges, participants, templates,
};
export type World = typeof world;
