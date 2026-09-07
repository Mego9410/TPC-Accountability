/**
 * The furnished example. A handful of UK principals so the tour looks like a
 * lived-in Club: one settled partnership with goals running between them, a
 * request waiting to be answered, and visits in every state.
 *
 * Dates are relative to "now" so the demo never goes stale.
 */
import type { Goal, GoalUpdate, Message, Partnership, Profile, Visit } from "@/lib/domain";

export const IDS = {
  cheng: "u-cheng",
  adesanya: "u-adesanya",
  field: "u-field",
  shah: "u-shah",
  hart: "u-hart",
  delaney: "u-delaney",
  okafor: "u-okafor",
  house: "u-house",
} as const;

export type PersonaKey = "member" | "partner" | "house";
export const PERSONA_USER: Record<PersonaKey, string> = {
  member: IDS.cheng,
  partner: IDS.adesanya,
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
    focusAreas: [],
    openToVisits: true,
    openToPartner: false,
    role: "member",
    onboarded: true,
    nudgeOptOut: false,
    createdAt: iso(-200),
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
    bio: "Two surgeries in central London. Three years in and still working out which decisions are actually mine to make.",
    membershipNo: "0149",
    focusAreas: ["Treatment plan conversion", "Recruitment", "Work and life in balance"],
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
    bio: "Bought a single-surgery practice in 2012 and grew it to six chairs. Opening a second site this year, which is going about as smoothly as the first one did.",
    membershipNo: "0151",
    focusAreas: ["Acquisition or expansion", "Team and culture"],
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
    bio: "Small practice, large diary problems. Currently spending more on advertising than I would like to admit.",
    membershipNo: "0162",
    focusAreas: ["New patient growth", "Financial performance"],
    openToPartner: true,
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
    bio: "Two hygienists off one nurse and a diary that does not break. Glad to show anyone how.",
    membershipNo: "0168",
    focusAreas: ["Clinical systems and quality", "Recruitment"],
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
    bio: "Mostly NHS, and thinking hard about what the next five years look like.",
    membershipNo: "0171",
    focusAreas: ["Preparing to sell", "Work and life in balance"],
    createdAt: iso(-70),
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
    openToPartner: true,
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
    bio: "Three sites. Glad to have people round; I learn as much from being asked as from asking.",
    membershipNo: "0130",
    focusAreas: ["Acquisition or expansion", "Financial performance"],
    openToPartner: true,
    createdAt: iso(-500),
  }),
  profile({
    id: IDS.house,
    honorific: "",
    fullName: "The House",
    email: "house@principalsclub.co.uk",
    membershipNo: "0001",
    role: "staff",
    openToVisits: false,
    createdAt: iso(-600),
  }),
];

/* ---------- Partnerships ---------- */
export const partnerships: Partnership[] = [
  {
    id: "p-cheng-adesanya",
    aId: IDS.cheng,
    bId: IDS.adesanya,
    proposedById: IDS.cheng,
    status: "active",
    message: "You have done the thing I am three years off doing. I would rather hear it from you than read it.",
    startedAt: iso(-96),
    endedAt: null,
    createdAt: iso(-98),
  },
  {
    id: "p-delaney-cheng",
    aId: IDS.delaney,
    bId: IDS.cheng,
    proposedById: IDS.delaney,
    status: "proposed",
    message: "We are both early and both in a mess about recruitment. It might be useful to compare notes each month.",
    startedAt: null,
    endedAt: null,
    createdAt: iso(-3),
  },
  {
    id: "p-field-hart",
    aId: IDS.field,
    bId: IDS.hart,
    proposedById: IDS.field,
    status: "active",
    message: null,
    startedAt: iso(-60),
    endedAt: null,
    createdAt: iso(-62),
  },
];

/* ---------- Goals ---------- */
function goal(g: Partial<Goal> & Pick<Goal, "id" | "userId" | "title">): Goal {
  return { detail: null, targetDate: null, status: "open", doneAt: null, createdAt: iso(-90), ...g };
}

export const goals: Goal[] = [
  goal({
    id: "g-cheng-acceptance",
    userId: IDS.cheng,
    title: "Get treatment plan acceptance above 65%",
    detail: "It was 58% when I last looked properly, which was a year ago.",
    targetDate: day(88),
    createdAt: iso(-90),
  }),
  goal({
    id: "g-cheng-associate",
    userId: IDS.cheng,
    title: "Recruit an associate for two days a week",
    detail: "I cannot keep covering Thursdays myself.",
    targetDate: day(54),
    createdAt: iso(-62),
  }),
  goal({
    id: "g-cheng-week-off",
    userId: IDS.cheng,
    title: "Take a full week off without checking email",
    status: "done",
    doneAt: iso(-21),
    createdAt: iso(-90),
  }),
  goal({
    id: "g-adesanya-site",
    userId: IDS.adesanya,
    title: "Open the second site by spring",
    detail: "Lease, fit-out, and a lead clinician who is not me.",
    targetDate: day(150),
    createdAt: iso(-96),
  }),
  goal({
    id: "g-adesanya-recall",
    userId: IDS.adesanya,
    title: "Hand the recall list to Nadia entirely",
    status: "done",
    doneAt: iso(-40),
    createdAt: iso(-96),
  }),
];

export const goalUpdates: GoalUpdate[] = [
  { id: "gu-1", goalId: "g-cheng-acceptance", authorId: IDS.cheng, body: "Up to 62% from 58. The follow-up call after the consultation is doing most of the work.", createdAt: iso(-28) },
  { id: "gu-2", goalId: "g-cheng-acceptance", authorId: IDS.adesanya, body: "You said 65 by December and you are three points off in September. Raise it to 70 or you will coast.", createdAt: iso(-27) },
  { id: "gu-3", goalId: "g-cheng-acceptance", authorId: IDS.cheng, body: "Fair. Leaving it at 65 until the associate is in, then raising it.", createdAt: iso(-26) },
  { id: "gu-4", goalId: "g-cheng-associate", authorId: IDS.cheng, body: "Two interviews booked for the 18th. Both want three days rather than two.", createdAt: iso(-6) },
  { id: "gu-5", goalId: "g-cheng-associate", authorId: IDS.adesanya, body: "Take the three days. You will fill them within a quarter and you know it.", createdAt: iso(-5) },
  { id: "gu-6", goalId: "g-adesanya-site", authorId: IDS.adesanya, body: "Lease signed. Fit-out tenders back next week.", createdAt: iso(-9) },
  { id: "gu-7", goalId: "g-adesanya-site", authorId: IDS.cheng, body: "How are you covering your own diary while all this is going on?", createdAt: iso(-8) },
];

/* ---------- Visits ---------- */
function visit(v: Partial<Visit> & Pick<Visit, "id" | "visitorId" | "hostId" | "proposedById" | "scheduledAt">): Visit {
  return {
    status: "proposed",
    practiceName: null,
    proposalNote: null,
    arrivalNote: null,
    notes: null,
    createdAt: iso(-30),
    ...v,
  };
}

export const visits: Visit[] = [
  // Held: a morning in Leeds, written up afterwards.
  visit({
    id: "v-adesanya",
    visitorId: IDS.cheng,
    hostId: IDS.adesanya,
    proposedById: IDS.adesanya,
    scheduledAt: iso(-40, 8, 30),
    status: "held",
    practiceName: "Adesanya Dental, Leeds",
    proposalNote: "Come and see the huddle and the recall before you change anything at your end.",
    arrivalNote: "Park on Belgrave Street, not the practice car park. Ask for Nadia at reception; she knows you are coming. Coffee from half eight.",
    notes:
      "The huddle runs to nine minutes and everyone stands. Ours runs to twenty and everyone sits. Two hygienists to one nurse, and the nurse turns both rooms, so nobody waits on anybody. Reception answers the phone with the patient's name before the reason for the call, which changes the whole conversation.\n\nAmara's own note: Jordan asked why we still take the deposit at the second visit and I did not have an answer. Nobody here has asked me that in six years.",
    createdAt: iso(-62),
  }),
  // Held, but over a year ago, so it does not count against this year's two.
  visit({
    id: "v-shah",
    visitorId: IDS.cheng,
    hostId: IDS.shah,
    proposedById: IDS.cheng,
    scheduledAt: iso(-400, 9, 0),
    status: "held",
    practiceName: "Shah & Associates, Didsbury",
    arrivalNote: "The front door is locked before nine. Ring the bell and Deborah will let you in.",
    notes: "Eleven minutes between patients. We average nineteen and I would have sworn we were quicker.",
    createdAt: iso(-425),
  }),
  // Agreed and in the diary: Amara comes to Marylebone.
  visit({
    id: "v-cheng",
    visitorId: IDS.adesanya,
    hostId: IDS.cheng,
    proposedById: IDS.cheng,
    scheduledAt: iso(21, 8, 30),
    status: "agreed",
    practiceName: "Cheng Dental, Marylebone",
    proposalNote: "I would like you to see an ordinary Tuesday before you tell me what you think of the diary.",
    createdAt: iso(-11),
  }),
  // Proposed, and waiting on Jordan to answer.
  visit({
    id: "v-field-asks",
    visitorId: IDS.field,
    hostId: IDS.cheng,
    proposedById: IDS.field,
    scheduledAt: iso(34, 8, 45),
    status: "proposed",
    practiceName: "Cheng Dental, Marylebone",
    proposalNote: "You mentioned the treatment coordinator model at the last members' evening. I would like to see it running before I commit to hiring one.",
    createdAt: iso(-2),
  }),
];

/* ---------- Correspondence ---------- */
let mN = 0;
function message(fromId: string, toId: string, daysAgo: number, hour: number, body: string, read = true): Message {
  mN += 1;
  return { id: `m-${mN}`, fromId, toId, body, readAt: read ? iso(-daysAgo, hour + 1) : null, createdAt: iso(-daysAgo, hour) };
}

export const messages: Message[] = [
  message(IDS.adesanya, IDS.cheng, 26, 8, "How did the acceptance number land in the end?"),
  message(IDS.cheng, IDS.adesanya, 26, 21, "62%. Up four points. I will take it."),
  message(IDS.adesanya, IDS.cheng, 25, 7, "Take it, then raise the target. Four points in a quarter is not a fluke."),
  message(IDS.cheng, IDS.adesanya, 7, 12, "Interviews are on the 18th. Both candidates want three days rather than two."),
  message(IDS.adesanya, IDS.cheng, 6, 8, "That is a good problem. Say yes to the better one and worry about the third day afterwards.", false),
  message(IDS.delaney, IDS.cheng, 3, 19, "I have sent you a partner request. No hard feelings either way if you are already sorted.", false),
];

export const world = { profiles, partnerships, goals, goalUpdates, visits, messages };
export type World = typeof world;
