import type { Metadata } from "next";
import { format } from "date-fns";
import { requireUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Body, Button, Card, Caption, Divider, Eyebrow, H1, H3 } from "@/components/ui";
import { CreateChallengeForm } from "@/components/accountability/create-challenge-form";
import {
  joinChallenge,
  leaveChallenge,
  setLeaderboardOptIn,
  updateChallengeProgress,
} from "@/lib/actions/challenges";
import type { Challenge, ChallengeParticipant } from "@/lib/types";

export const metadata: Metadata = { title: "Challenges" };

type LeaderRow = { display_name: string; progress: number; rank: number };

export default async function ChallengesPage() {
  const { profile } = await requireUserProfile();
  const isAdmin = profile.role === "house";
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: challengeRows } = await supabase
    .from("challenges")
    .select("*")
    .order("start_date", { ascending: false });
  const challenges = (challengeRows ?? []) as Challenge[];

  const { data: myRows } = await supabase
    .from("challenge_participants")
    .select("challenge_id, progress, leaderboard_opt_in");
  const mine = new Map(
    ((myRows ?? []) as Pick<ChallengeParticipant, "challenge_id" | "progress" | "leaderboard_opt_in">[]).map(
      (r) => [r.challenge_id, r],
    ),
  );

  const boards = new Map<string, LeaderRow[]>();
  await Promise.all(
    challenges.map(async (c) => {
      const { data } = await supabase.rpc("challenge_leaderboard", { p_challenge: c.id });
      boards.set(c.id, (data ?? []) as LeaderRow[]);
    }),
  );

  return (
    <div className="section fade-enter">
      <Eyebrow>Club challenges</Eyebrow>
      <H1>Sprints &amp; challenges.</H1>
      <Body className="muted" style={{ maxWidth: 640 }}>
        Time-boxed challenges the whole Club can take on together. The
        leaderboard is entirely opt-in — and shows names only, never figures.
      </Body>

      {isAdmin && (
        <>
          <Divider />
          <Card emphasis>
            <Eyebrow>New challenge (staff)</Eyebrow>
            <div style={{ marginTop: 12 }}>
              <CreateChallengeForm defaultStart={today} />
            </div>
          </Card>
        </>
      )}

      <Divider />

      {challenges.length === 0 ? (
        <Caption>No challenges yet.</Caption>
      ) : (
        <div className="stack gap-6">
          {challenges.map((c) => {
            const me = mine.get(c.id);
            const joined = Boolean(me);
            const board = boards.get(c.id) ?? [];
            const active = new Date(`${c.end_date}T23:59:59`) >= new Date();
            return (
              <Card key={c.id}>
                <div className="row between" style={{ alignItems: "flex-start" }}>
                  <div>
                    <H3>{c.title}</H3>
                    <Caption>
                      {format(new Date(`${c.start_date}T00:00:00`), "d MMM")} —{" "}
                      {format(new Date(`${c.end_date}T00:00:00`), "d MMM yyyy")}
                    </Caption>
                  </div>
                  <Badge variant={active ? "gold" : ""}>{active ? "open" : "closed"}</Badge>
                </div>
                {c.description && <Body style={{ marginTop: 8 }}>{c.description}</Body>}

                <div className="row gap-4" style={{ marginTop: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                  {!joined ? (
                    <form action={joinChallenge}>
                      <input type="hidden" name="challenge_id" value={c.id} />
                      <Button type="submit" size="sm">
                        Join the challenge
                      </Button>
                    </form>
                  ) : (
                    <>
                      <form action={updateChallengeProgress} className="row gap-4" style={{ alignItems: "flex-end" }}>
                        <input type="hidden" name="challenge_id" value={c.id} />
                        <div className="field" style={{ width: 120 }}>
                          <label htmlFor={`progress-${c.id}`}>Your progress</label>
                          <input
                            id={`progress-${c.id}`}
                            name="progress"
                            type="number"
                            step="any"
                            min={0}
                            defaultValue={me?.progress ?? 0}
                          />
                        </div>
                        <Button type="submit" size="sm" variant="secondary">
                          Update
                        </Button>
                      </form>

                      <form action={setLeaderboardOptIn}>
                        <input type="hidden" name="challenge_id" value={c.id} />
                        <input type="hidden" name="opt_in" value={me?.leaderboard_opt_in ? "false" : "true"} />
                        <Button type="submit" size="sm" variant="ghost">
                          {me?.leaderboard_opt_in ? "Hide me from leaderboard" : "Show me on leaderboard"}
                        </Button>
                      </form>

                      <form action={leaveChallenge}>
                        <input type="hidden" name="challenge_id" value={c.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          Leave
                        </Button>
                      </form>
                    </>
                  )}
                </div>

                <div style={{ marginTop: 16 }}>
                  <Eyebrow>Leaderboard (opt-in)</Eyebrow>
                  {board.length === 0 ? (
                    <Caption style={{ marginTop: 6 }}>
                      No one has opted in yet. Opt in above to appear here.
                    </Caption>
                  ) : (
                    <ol style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                      {board.map((r, i) => (
                        <li key={`${c.id}-${i}`}>
                          <Caption>
                            {r.display_name} — {r.progress}
                          </Caption>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
