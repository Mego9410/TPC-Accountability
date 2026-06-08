"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runTranscription } from "@/lib/actions/transcription";
import { saveExtractedGoals } from "@/lib/actions/goals";
import { Button, Divider, Eyebrow, H3 } from "@/components/ui";
import type { ExtractedGoal } from "@/lib/integrations/goals-ai";

const DEMO_TRANSCRIPT = `Dr. Cheng: Shall we review where we left things last month?
Dr. Adesanya: I said I would finish the associate recruitment for the second surgery.
Dr. Cheng: For this month, aim to make an offer to a candidate by the end of the month.
Dr. Adesanya: Agreed. I will also lift hygiene recall rates above eighty percent.
Dr. Cheng: I will renegotiate the lab contract and expect a ten percent reduction.
Dr. Adesanya: Let us each read one chapter of the practice management book before the next sitting.`;

const DEMO_GOALS: ExtractedGoal[] = [
  {
    title: "Make an offer to an associate candidate by month end",
    detail: "Following the two interviews held this week.",
  },
  {
    title: "Lift hygiene recall rates above eighty percent",
    detail: "Finalise the new recall system.",
  },
  {
    title: "Read one chapter of the practice management book",
    detail: "Before the next sitting.",
  },
];

export function TranscriptPanel({
  meetingId,
  partnershipId,
  existingTranscript,
  demo,
}: {
  meetingId: string;
  partnershipId: string;
  existingTranscript: string | null;
  demo?: boolean;
}) {
  const router = useRouter();
  const [transcript, setTranscript] = useState<string | null>(existingTranscript);
  const [goals, setGoals] = useState<ExtractedGoal[]>([]);
  const [chosen, setChosen] = useState<Record<number, boolean>>({});
  const [note, setNote] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    setNote(null);
    setSaved(false);
    if (demo) {
      setTranscript(DEMO_TRANSCRIPT);
      setGoals(DEMO_GOALS);
      setChosen(Object.fromEntries(DEMO_GOALS.map((_, i) => [i, true])));
      setNote("Preview — this is an example transcript and extraction. Connect keys to run it live.");
      return;
    }
    startTransition(async () => {
      const res = await runTranscription(meetingId);
      if (!res) {
        setNote("The transcript could not be produced.");
        return;
      }
      setTranscript(res.transcript);
      setGoals(res.goals);
      setChosen(Object.fromEntries(res.goals.map((_, i) => [i, true])));
      if (res.transcriptStub || res.goalsStub) {
        setNote(
          "Demo mode — add DEEPGRAM_API_KEY and OPENAI_API_KEY for live transcription and extraction.",
        );
      }
    });
  }

  function save() {
    const selected = goals.filter((_, i) => chosen[i]);
    if (selected.length === 0) return;
    if (demo) {
      setSaved(true);
      setGoals([]);
      return;
    }
    startTransition(async () => {
      await saveExtractedGoals(partnershipId, meetingId, selected);
      setSaved(true);
      setGoals([]);
      router.refresh();
    });
  }

  return (
    <div className="stack gap-5">
      <div className="row between wrap">
        <div>
          <Eyebrow>The record</Eyebrow>
          <H3 style={{ marginTop: 6 }}>Transcript and goals</H3>
        </div>
        <Button variant="secondary" size="sm" onClick={run} disabled={pending}>
          {pending ? "Working" : transcript ? "Re-run extraction" : "Transcribe the sitting"}
        </Button>
      </div>

      {note && <div className="notice">{note}</div>}
      {saved && <div className="notice"><b>Set down.</b> The goals are added to the ledger.</div>}

      {transcript && (
        <div
          style={{
            maxHeight: 220,
            overflowY: "auto",
            border: "1px solid var(--rule-on-paper)",
            padding: 18,
            background: "var(--bg-paper)",
            font: "400 15px/1.7 var(--font-serif)",
            color: "var(--fg-on-paper-muted)",
            whiteSpace: "pre-wrap",
          }}
        >
          {transcript}
        </div>
      )}

      {goals.length > 0 && (
        <>
          <Divider glyph="—" tight />
          <Eyebrow>Proposed goals — confirm before they are set down</Eyebrow>
          <div className="stack">
            {goals.map((g, i) => (
              <label key={i} className="goal" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={chosen[i] ?? false}
                  onChange={(e) => setChosen((c) => ({ ...c, [i]: e.target.checked }))}
                  style={{ width: "auto", marginTop: 4 }}
                />
                <div className="text">
                  <div className="t">{g.title}</div>
                  {g.detail && <div className="d">{g.detail}</div>}
                </div>
              </label>
            ))}
          </div>
          <div className="row">
            <Button onClick={save} disabled={pending}>
              Set down the chosen goals
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
