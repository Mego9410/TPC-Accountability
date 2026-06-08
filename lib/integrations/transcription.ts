import "server-only";
import { env } from "@/lib/env";

export interface TranscriptResult {
  text: string;
  provider: string;
  stub: boolean;
}

/** A representative sitting between two principal dentists, for demo mode. */
const DEMO_TRANSCRIPT = `Dr. Cheng: Good to see you again. Shall we review where we left things last month?
Dr. Adesanya: Yes. I said I would finish the associate recruitment for the second surgery.
Dr. Cheng: And did you?
Dr. Adesanya: The advert is live and I have two interviews next week, but no offer yet.
Dr. Cheng: Good progress. For this month, I think you should aim to make an offer to a candidate by the end of the month.
Dr. Adesanya: Agreed. I will also finalise the new hygiene recall system — I want recall rates above eighty percent.
Dr. Cheng: On my side, I committed to renegotiating the lab contract. I have a meeting booked and expect to reduce costs by ten percent.
Dr. Adesanya: That is a strong target. What about your treatment plan conversion?
Dr. Cheng: I will introduce a structured treatment coordinator role and track conversion weekly. My goal is to raise acceptance from sixty to seventy percent this quarter.
Dr. Adesanya: Let us also each read one chapter of the practice management book before the next sitting.
Dr. Cheng: Agreed. Same time next month.`;

/**
 * Transcribe a recording. With DEEPGRAM_API_KEY set, calls Deepgram's
 * pre-recorded API. Otherwise returns a representative demo transcript so the
 * transcript-to-goals flow can be exercised end to end without keys.
 */
export async function transcribeRecording(
  audioUrl: string | null,
): Promise<TranscriptResult> {
  if (!env.deepgram.isConfigured || !audioUrl) {
    return { text: DEMO_TRANSCRIPT, provider: "stub", stub: true };
  }

  const res = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&punctuate=true",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${env.deepgram.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: audioUrl }),
    },
  );

  if (!res.ok) {
    return { text: DEMO_TRANSCRIPT, provider: "stub", stub: true };
  }

  const data = (await res.json()) as {
    results?: {
      channels?: Array<{
        alternatives?: Array<{ transcript?: string }>;
      }>;
    };
  };
  const text =
    data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? DEMO_TRANSCRIPT;
  return { text, provider: "deepgram", stub: false };
}

export { DEMO_TRANSCRIPT };
