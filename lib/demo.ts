import type {
  Goal,
  MatchPreference,
  Meeting,
  Message,
  PartnershipWithPartner,
  Profile,
} from "@/lib/types";

/**
 * Demo data for preview mode — a furnished example of the member surface shown
 * when Supabase is not configured and the visitor has chosen to tour the Club.
 * None of this is persisted.
 */

export const DEMO_USER_ID = "demo-user";
export const DEMO_PARTNER_ID = "demo-partner";
export const DEMO_PARTNERSHIP_ID = "demo-partnership";
export const DEMO_MEETING_ID = "demo-meeting";

function daysFromNow(days: number, hour = 18, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const demoProfile: Profile = {
  id: DEMO_USER_ID,
  honorific: "Dr",
  full_name: "Dr. Jordan Cheng",
  practice_name: "Cheng Dental, Marylebone",
  location: "London",
  timezone: "Europe/London",
  bio: "Two surgeries in central London. Working towards a structured treatment coordinator model and a calmer week.",
  avatar_url: null,
  membership_no: "0149",
  role: "principal",
  onboarded: true,
  created_at: daysFromNow(-120),
  updated_at: daysFromNow(-2),
};

export const demoPartner: Profile = {
  id: DEMO_PARTNER_ID,
  honorific: "Dr",
  full_name: "Dr. Amara Adesanya",
  practice_name: "Adesanya Dental, Leeds",
  location: "Leeds",
  timezone: "Europe/London",
  bio: "Single-site practice with an associate team. Focused this season on recruitment and a stronger hygiene recall.",
  avatar_url: null,
  membership_no: "0151",
  role: "principal",
  onboarded: true,
  created_at: daysFromNow(-110),
  updated_at: daysFromNow(-5),
};

export const demoPartnership: PartnershipWithPartner = {
  id: DEMO_PARTNERSHIP_ID,
  member_a: DEMO_USER_ID,
  member_b: DEMO_PARTNER_ID,
  cadence: "monthly",
  status: "active",
  created_at: daysFromNow(-90),
  ended_at: null,
  partner: demoPartner,
};

export const demoMeetings: Meeting[] = [
  {
    id: DEMO_MEETING_ID,
    partnership_id: DEMO_PARTNERSHIP_ID,
    scheduled_at: daysFromNow(12),
    cadence: "monthly",
    daily_room_url: null,
    daily_room_name: null,
    status: "scheduled",
    google_event_id: null,
    microsoft_event_id: null,
    created_by: DEMO_USER_ID,
    created_at: daysFromNow(-18),
  },
  {
    id: "demo-meeting-past",
    partnership_id: DEMO_PARTNERSHIP_ID,
    scheduled_at: daysFromNow(-18),
    cadence: "monthly",
    daily_room_url: null,
    daily_room_name: null,
    status: "completed",
    google_event_id: null,
    microsoft_event_id: null,
    created_by: DEMO_USER_ID,
    created_at: daysFromNow(-48),
  },
];

export const demoGoals: Goal[] = [
  {
    id: "demo-goal-1",
    partnership_id: DEMO_PARTNERSHIP_ID,
    owner_id: DEMO_USER_ID,
    meeting_id: "demo-meeting-past",
    title: "Raise treatment plan acceptance from sixty to seventy percent",
    detail: "Tracked weekly with the new treatment coordinator.",
    status: "open",
    source: "transcript",
    due_at: null,
    completed_at: null,
    created_at: daysFromNow(-18),
  },
  {
    id: "demo-goal-2",
    partnership_id: DEMO_PARTNERSHIP_ID,
    owner_id: DEMO_USER_ID,
    meeting_id: "demo-meeting-past",
    title: "Renegotiate the lab contract for a ten percent reduction",
    detail: "Meeting booked for the end of the month.",
    status: "open",
    source: "transcript",
    due_at: null,
    completed_at: null,
    created_at: daysFromNow(-18),
  },
  {
    id: "demo-goal-3",
    partnership_id: DEMO_PARTNERSHIP_ID,
    owner_id: DEMO_USER_ID,
    meeting_id: "demo-meeting-past",
    title: "Read one chapter of the practice management book",
    detail: null,
    status: "done",
    source: "manual",
    due_at: null,
    completed_at: daysFromNow(-3),
    created_at: daysFromNow(-18),
  },
  {
    id: "demo-goal-4",
    partnership_id: DEMO_PARTNERSHIP_ID,
    owner_id: DEMO_PARTNER_ID,
    meeting_id: "demo-meeting-past",
    title: "Make an offer to an associate candidate by month end",
    detail: "Two interviews held; an offer to follow.",
    status: "open",
    source: "transcript",
    due_at: null,
    completed_at: null,
    created_at: daysFromNow(-18),
  },
  {
    id: "demo-goal-5",
    partnership_id: DEMO_PARTNERSHIP_ID,
    owner_id: DEMO_PARTNER_ID,
    meeting_id: "demo-meeting-past",
    title: "Lift hygiene recall rates above eighty percent",
    detail: "New recall system to be finalised.",
    status: "open",
    source: "transcript",
    due_at: null,
    completed_at: null,
    created_at: daysFromNow(-18),
  },
];

export const demoMessages: Message[] = [
  {
    id: "demo-msg-1",
    partnership_id: DEMO_PARTNERSHIP_ID,
    sender_id: DEMO_PARTNER_ID,
    body: "Good to see you last month. The lab negotiation sounds promising.",
    read_at: daysFromNow(-16),
    created_at: daysFromNow(-16),
  },
  {
    id: "demo-msg-2",
    partnership_id: DEMO_PARTNERSHIP_ID,
    sender_id: DEMO_USER_ID,
    body: "Thank you. I have the meeting on Thursday. How are the interviews going?",
    read_at: daysFromNow(-16),
    created_at: daysFromNow(-16),
  },
  {
    id: "demo-msg-3",
    partnership_id: DEMO_PARTNERSHIP_ID,
    sender_id: DEMO_PARTNER_ID,
    body: "Two strong candidates. I expect to make an offer before our next sitting.",
    read_at: null,
    created_at: daysFromNow(-15),
  },
];

export const demoPreferences: MatchPreference = {
  id: "demo-pref",
  user_id: DEMO_USER_ID,
  focus_areas: ["Treatment plan conversion", "Team and culture", "Work and life in balance"],
  interests: ["Implants", "Leadership", "Cycling"],
  cadence: "monthly",
  preferred_times: ["Mornings", "Evenings"],
  status: "matched",
  created_at: daysFromNow(-90),
  updated_at: daysFromNow(-5),
};

export const demoConnections: never[] = [];
