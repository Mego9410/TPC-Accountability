import "server-only";
import OpenAI from "openai";
import { env } from "@/lib/env";

export interface ExtractedGoal {
  title: string;
  detail: string;
}

const SYSTEM_PROMPT = `You are the recording secretary of a private accountability society for principal dentists.
From a meeting transcript, extract the concrete commitments each member made for the period ahead.
Return only forward-looking goals the speakers committed to — not past results or general discussion.
Each goal must be a single, checkable action with a measurable outcome where one was stated.
Write in restrained, professional prose. No emoji. No exclamation marks.`;

/**
 * Turn a transcript into a set of checkable goals.
 * With OPENAI_API_KEY set, uses the model; otherwise falls back to a heuristic
 * extractor so the confirm-before-save flow works without keys.
 */
export async function extractGoals(transcript: string): Promise<{
  goals: ExtractedGoal[];
  stub: boolean;
}> {
  if (!env.openai.isConfigured) {
    return { goals: heuristicGoals(transcript), stub: true };
  }

  try {
    const client = new OpenAI({ apiKey: env.openai.apiKey });
    const completion = await client.chat.completions.create({
      model: env.openai.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `Transcript:\n\n${transcript}\n\n` +
            `Return JSON of the form { "goals": [ { "title": string, "detail": string } ] }. ` +
            `Title is a short imperative; detail adds the measurable target or context.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { goals?: ExtractedGoal[] };
    const goals = (parsed.goals ?? [])
      .filter((g) => g.title?.trim())
      .map((g) => ({ title: g.title.trim(), detail: (g.detail ?? "").trim() }));
    return { goals, stub: false };
  } catch {
    return { goals: heuristicGoals(transcript), stub: true };
  }
}

/** Lightweight commitment finder used when no model key is present. */
function heuristicGoals(transcript: string): ExtractedGoal[] {
  const lines = transcript
    .split(/\n+/)
    .map((l) => l.replace(/^[A-Z][a-z]+\.?\s[A-Za-z]+:\s*/, "").trim())
    .filter(Boolean);

  const intent =
    /\b(i will|i'll|i am going to|my goal is|i want to|i should|aim to|i commit|let us|let's|i plan to)\b/i;

  const found: ExtractedGoal[] = [];
  for (const line of lines) {
    if (!intent.test(line)) continue;
    const clean = line.replace(/\s+/g, " ").trim();
    const title = clean.length > 80 ? clean.slice(0, 77).trimEnd() + "…" : clean;
    found.push({ title: capitalize(title), detail: clean });
    if (found.length >= 6) break;
  }

  if (found.length === 0) {
    return [
      {
        title: "Set one measurable goal for the period ahead",
        detail: "No explicit commitments were detected in the transcript.",
      },
    ];
  }
  return found;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
