import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUserProfile, surnameAddress } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Body, Button, Divider, Eyebrow, H1 } from "@/components/ui";
import { MeetingRoom } from "@/components/meeting-room";
import { TranscriptPanel } from "@/components/transcript-panel";
import { GoalList } from "@/components/goal-list";
import { CADENCE_LABEL, formatAppointment } from "@/lib/cadence";
import { isPreviewMode } from "@/lib/preview";
import { demoGoals, demoMeetings, demoPartner } from "@/lib/demo";
import type { Goal, Meeting, Partnership, Profile, Transcript } from "@/lib/types";

export const metadata: Metadata = { title: "The sitting" };

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await requireUserProfile();
  const preview = await isPreviewMode();

  let meeting: Meeting;
  let partner: Profile | null;
  let transcript: Transcript | null = null;
  let sittingGoals: Goal[];

  if (preview) {
    const found = demoMeetings.find((m) => m.id === id) ?? demoMeetings[0];
    meeting = found;
    partner = demoPartner;
    sittingGoals = demoGoals.filter((g) => g.meeting_id === meeting.id);
  } else {
    const supabase = await createClient();

    const { data: meetingRow } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!meetingRow) notFound();
    meeting = meetingRow as Meeting;

    const { data: partnershipRow } = await supabase
      .from("partnerships")
      .select("*")
      .eq("id", meeting.partnership_id)
      .maybeSingle();
    if (!partnershipRow) notFound();
    const partnership = partnershipRow as Partnership;

    const partnerId = partnership.member_a === userId ? partnership.member_b : partnership.member_a;
    const { data: partnerRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", partnerId)
      .maybeSingle();
    partner = (partnerRow as Profile) ?? null;

    const { data: transcriptRow } = await supabase
      .from("transcripts")
      .select("*")
      .eq("meeting_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    transcript = transcriptRow as Transcript | null;

    const { data: goalRows } = await supabase
      .from("goals")
      .select("*")
      .eq("meeting_id", id)
      .order("created_at", { ascending: false });
    sittingGoals = (goalRows as Goal[]) ?? [];
  }

  const myGoals = sittingGoals.filter((g) => g.owner_id === userId);
  const partnerName = partner ? surnameAddress(partner) : "your partner";
  const statusVariant =
    meeting.status === "completed" ? "confirmed" : meeting.status === "cancelled" ? "declined" : "gold";

  return (
    <div className="section fade-enter" style={{ maxWidth: 980 }}>
      <Button href="/dashboard" variant="ghost">
        ← Back to the House
      </Button>

      <div>
        <div className="row between wrap">
          <Eyebrow>{formatAppointment(meeting.scheduled_at)}</Eyebrow>
          <Badge variant={statusVariant}>
            {meeting.status === "completed"
              ? "Concluded"
              : meeting.status === "cancelled"
                ? "Cancelled"
                : "Held"}
          </Badge>
        </div>
        <H1 style={{ marginTop: 12 }}>A sitting with {partnerName}.</H1>
        <Body className="muted">{CADENCE_LABEL[meeting.cadence]} cadence.</Body>
      </div>

      <MeetingRoom
        meetingId={meeting.id}
        initialRoomUrl={meeting.daily_room_url}
        status={meeting.status}
        demo={preview}
      />

      <Divider />

      <div className="card">
        <TranscriptPanel
          meetingId={meeting.id}
          partnershipId={meeting.partnership_id}
          existingTranscript={transcript?.raw_text ?? null}
          demo={preview}
        />
      </div>

      {myGoals.length > 0 && (
        <div className="stack gap-4">
          <Eyebrow>Goals set down at this sitting</Eyebrow>
          <GoalList goals={myGoals} canEdit demo={preview} />
        </div>
      )}
    </div>
  );
}
