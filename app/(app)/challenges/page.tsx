import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canSeeSociety, requireViewer } from "@/lib/session";
import type { Challenge, ChallengeParticipant, LeaderboardRow } from "@/lib/domain";
import { formatLongDate } from "@/lib/weeks";
import {
  Badge, Body, Caption, Card, EmptyState, Eyebrow, Field, H3, PageHeader, Section, Stat, TextArea,
} from "@/components/ui";
import { Form, SubmitButton } from "@/components/ui/form";
import { createChallenge, joinChallenge, updateProgress } from "@/lib/actions/challenges";

export const metadata: Metadata = { title: "Challenges" };

type Phase = "active" | "upcoming" | "closed";

export default async function ChallengesPage() {
  const { profile, repo, userId } = await requireViewer();
  if (!canSeeSociety(profile)) redirect("/upgrade");

  const today = new Date().toISOString().slice(0, 10);
  const phaseOf = (c: Challenge): Phase => (c.endDate < today ? "closed" : c.startDate > today ? "upcoming" : "active");
  const order: Record<Phase, number> = { active: 0, upcoming: 1, closed: 2 };

  const [challenges, participation] = await Promise.all([repo.listChallenges(), repo.listParticipation(userId)]);
  const sorted = [...challenges].sort((a, b) => order[phaseOf(a)] - order[phaseOf(b)] || b.startDate.localeCompare(a.startDate));
  const boards = await Promise.all(sorted.map((c) => repo.leaderboard(c.id)));

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="The Society"
        title="Challenges."
        lede="Short, optional sprints across the Club. Join, count, and choose whether your name appears."
      />

      {profile.role === "staff" && <OpenChallenge />}

      {sorted.length === 0 ? (
        <EmptyState title="No challenge is open.">
          The House opens a sprint every so often. When one is running it appears here, and you may join or ignore it as you please.
        </EmptyState>
      ) : (
        <div className="stack gap-6">
          {sorted.map((c, i) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              phase={phaseOf(c)}
              mine={participation.find((p) => p.challengeId === c.id) ?? null}
              board={boards[i]}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- One challenge ---------- */

const PHASE_LABEL: Record<Phase, string> = { active: "Running", upcoming: "Opens soon", closed: "Closed" };
const PHASE_TONE: Record<Phase, string> = { active: "gold", upcoming: "", closed: "muted" };

function ChallengeCard({ challenge, phase, mine, board, userId }: { challenge: Challenge; phase: Phase; mine: ChallengeParticipant | null; board: LeaderboardRow[]; userId: string }) {
  const joined = mine !== null;
  const open = phase !== "closed";
  return (
    <Card emphasis={phase === "active" && !joined} as="article">
      <div className="row between wrap">
        <div className="stack gap-2">
          <Badge tone={PHASE_TONE[phase]}>{PHASE_LABEL[phase]}</Badge>
          <H3>{challenge.title}</H3>
        </div>
        <Caption>
          <time dateTime={challenge.startDate}>{formatLongDate(challenge.startDate)}</time> to{" "}
          <time dateTime={challenge.endDate}>{formatLongDate(challenge.endDate)}</time> · counted in {challenge.metricLabel}
        </Caption>
      </div>
      {challenge.description && <Body>{challenge.description}</Body>}

      <div className="grid-even">
        <div className="stack gap-5">
          {joined && (
            <>
              <Stat value={mine.progress} label={challenge.metricLabel} sub="your count so far" tone="gold" />
              {open && (
                <Form action={updateProgress}>
                  {(state) => (
                    <>
                      <input type="hidden" name="challenge_id" value={challenge.id} />
                      <div className="form-row">
                        <Field label={`Your ${challenge.metricLabel}`} name="progress" type="number" inputMode="numeric" min={0} step={1} defaultValue={mine.progress} required error={state.errors.progress} />
                      </div>
                      <div className="form-actions">
                        <SubmitButton variant="secondary" size="sm">Update</SubmitButton>
                      </div>
                    </>
                  )}
                </Form>
              )}
            </>
          )}
          {open ? (
            <Form action={joinChallenge}>
              {(state) => (
                <>
                  <input type="hidden" name="challenge_id" value={challenge.id} />
                  <label htmlFor={`lb-${challenge.id}`} className="check single">
                    <input id={`lb-${challenge.id}`} type="checkbox" name="leaderboard" defaultChecked={mine?.leaderboardOptIn ?? true} />
                    <span>Show my name on the leaderboard</span>
                  </label>
                  {state.errors.leaderboard && <Caption>{state.errors.leaderboard}</Caption>}
                  <div className="form-actions">
                    <SubmitButton variant={joined ? "quiet" : "primary"} size="sm">{joined ? "Save preference" : "Join"}</SubmitButton>
                  </div>
                </>
              )}
            </Form>
          ) : (
            <Caption>{joined ? `You finished on ${mine.progress} ${challenge.metricLabel}.` : "This sprint has closed."}</Caption>
          )}
        </div>

        <Section title="Leaderboard">
          {board.length === 0 ? (
            <Caption>No one has chosen to appear yet. Names are shown only with leave; counts never carry a practice.</Caption>
          ) : (
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Principal</th>
                    <th scope="col" className="num">{challenge.metricLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((r) => (
                    <tr key={`${r.rank}-${r.userId ?? r.displayName}`} className={r.userId === userId ? "me" : undefined}>
                      <td className="num">{r.rank}</td>
                      <td>{r.displayName}{r.userId === userId ? " (you)" : ""}</td>
                      <td className="num">{r.progress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {joined && !mine.leaderboardOptIn && <Caption>Your name is kept off the board.</Caption>}
        </Section>
      </div>
    </Card>
  );
}

/* ---------- The House opens a challenge ---------- */

function OpenChallenge() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Card>
      <Eyebrow>Open a challenge</Eyebrow>
      <Form action={createChallenge} resetOnSuccess>
        {(state) => (
          <>
            <Field label="Title" name="title" required maxLength={100} placeholder="The ninety-day new-patient sprint" error={state.errors.title} />
            <TextArea label="Description" name="description" rows={2} maxLength={400} placeholder="What is counted, and from when." error={state.errors.description} />
            <div className="form-row">
              <Field label="What is counted" name="metric_label" required maxLength={40} placeholder="new patients" help="A plural noun, in lower case." error={state.errors.metric_label} />
              <Field label="Starts" name="start_date" type="date" required defaultValue={today} error={state.errors.start_date} />
              <Field label="Ends" name="end_date" type="date" required error={state.errors.end_date} />
            </div>
            <div className="form-actions">
              <SubmitButton>Open to the Club</SubmitButton>
            </div>
          </>
        )}
      </Form>
    </Card>
  );
}
