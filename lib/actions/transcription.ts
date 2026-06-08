"use server";

import { createClient } from "@/lib/supabase/server";
import { transcribeRecording } from "@/lib/integrations/transcription";
import { extractGoals, type ExtractedGoal } from "@/lib/integrations/goals-ai";

export interface TranscriptionRun {
  transcript: string;
  provider: string;
  goals: ExtractedGoal[];
  transcriptStub: boolean;
  goalsStub: boolean;
}

/**
 * Transcribe a meeting's recording and derive candidate goals.
 * Stores the transcript, but returns goals for the member to confirm before
 * they are written (confirm-before-save).
 */
export async function runTranscription(meetingId: string): Promise<TranscriptionRun | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .maybeSingle();
  if (!meeting) return null;

  // In a full deployment the recording URL would come from the Daily webhook;
  // here we pass null so demo mode yields a representative transcript.
  const recordingUrl: string | null = null;

  const { text, provider, stub: transcriptStub } = await transcribeRecording(recordingUrl);

  // Persist the transcript (replace any prior one for this meeting).
  await supabase.from("transcripts").delete().eq("meeting_id", meetingId);
  await supabase.from("transcripts").insert({
    meeting_id: meetingId,
    raw_text: text,
    provider,
  });

  const { goals, stub: goalsStub } = await extractGoals(text);

  return {
    transcript: text,
    provider,
    goals,
    transcriptStub,
    goalsStub,
  };
}
