/**
 * The pieces more than one page needs: the two loaders, the goal card, and the
 * small print of a principal. Server components throughout — the forms they
 * render are the client boundary.
 */
import type { Goal, GoalUpdate, Partnership, Profile } from "@/lib/domain";
import { awaitingAnswerFrom, partnerIdOf, practiceLine, yearsLine } from "@/lib/domain";
import type { Repo } from "@/lib/repo/types";
import { addGoalUpdate, editGoal, setGoalStatus } from "@/lib/actions/goals";
import { formatDayMonth, formatLongDate } from "@/lib/weeks";
import { Body, Caption, Card, FocusBadges, GoalBadge, cn } from "@/components/ui";
import { FField, FTextArea, Form, QuickAction, SubmitButton } from "@/components/ui/form";

/* ---------- Loaders ---------- */

export interface PartnerState {
  /** The one running partnership, if there is one. */
  active: Partnership | null;
  /** Requests waiting on the viewer to answer. */
  incoming: Partnership[];
  /** Requests the viewer has made and not yet had answered. */
  outgoing: Partnership[];
  /** Everyone named above, by id. */
  people: Map<string, Profile>;
}

export async function loadPartnerships(repo: Repo, userId: string): Promise<PartnerState> {
  const all = await repo.listPartnerships(userId);
  const active = all.find((p) => p.status === "active") ?? null;
  const incoming = all.filter((p) => awaitingAnswerFrom(p, userId));
  const outgoing = all.filter((p) => p.status === "proposed" && p.proposedById === userId);

  const named: Partnership[] = [...incoming, ...outgoing];
  if (active) named.push(active);
  const ids = [...new Set(named.map((p) => partnerIdOf(p, userId)))];
  const people = new Map((await repo.listProfiles(ids)).map((p) => [p.id, p]));
  return { active, incoming, outgoing, people };
}

export interface GoalSet {
  goals: Goal[];
  updatesFor: (goalId: string) => GoalUpdate[];
}

export async function loadGoals(repo: Repo, userIds: string[]): Promise<GoalSet> {
  const goals = userIds.length > 0 ? await repo.listGoals(userIds) : [];
  const updates = goals.length > 0 ? await repo.listGoalUpdates(goals.map((g) => g.id)) : [];
  const byGoal = new Map<string, GoalUpdate[]>();
  for (const u of updates) {
    const held = byGoal.get(u.goalId);
    if (held) held.push(u);
    else byGoal.set(u.goalId, [u]);
  }
  return { goals, updatesFor: (goalId: string) => byGoal.get(goalId) ?? [] };
}

/** A name for anyone the page has loaded, and a plain fallback for anyone it has not. */
export function namer(people: Map<string, Profile>, userId: string) {
  return (id: string): string => {
    if (id === userId) return "You";
    return people.get(id)?.fullName ?? "A principal";
  };
}

/* ---------- The small print of a principal ---------- */

export function Particulars({ profile, bio = true }: { profile: Profile; bio?: boolean }) {
  const years = yearsLine(profile);
  const line = practiceLine(profile);
  return (
    <div className="stack gap-3">
      {line && <Caption>{line}</Caption>}
      {years && <Caption>{years}</Caption>}
      {bio && profile.bio && <Body className="muted">{profile.bio}</Body>}
      <FocusBadges areas={profile.focusAreas} />
    </div>
  );
}

/* ---------- A goal ---------- */

export function GoalArticle({
  goal,
  updates,
  nameOf,
  mine,
  writePrompt,
}: {
  goal: Goal;
  updates: GoalUpdate[];
  nameOf: (id: string) => string;
  /** Yours: you may edit it, close it and reopen it. */
  mine: boolean;
  /** The label above the box for writing against it. */
  writePrompt: string;
}) {
  return (
    <Card as="article" className={cn("goal-card", goal.status === "done" && "done")}>
      <div className="goal-head">
        <div className="stack gap-2" style={{ minWidth: 0 }}>
          <h3 className="goal-title">{goal.title}</h3>
          <Caption>
            {goal.targetDate ? `By ${formatLongDate(goal.targetDate)}` : "No date set"}
            {goal.status === "done" && goal.doneAt ? ` · Done ${formatLongDate(goal.doneAt)}` : ""}
          </Caption>
        </div>
        <GoalBadge status={goal.status} />
      </div>

      {goal.detail && <Body className="muted">{goal.detail}</Body>}

      {mine && (
        <div className="goal-actions">
          <QuickAction
            action={setGoalStatus}
            fields={{ goal_id: goal.id, status: goal.status === "open" ? "done" : "open" }}
            variant="secondary"
          >
            {goal.status === "open" ? "Mark it done" : "Open it again"}
          </QuickAction>
          <details className="disclosure">
            <summary>Edit</summary>
            <div className="disclosure-body">
              <Form action={editGoal}>
                <input type="hidden" name="goal_id" value={goal.id} />
                <FField label="The goal" name="title" defaultValue={goal.title} required maxLength={160} />
                <FTextArea label="Detail" name="detail" rows={2} defaultValue={goal.detail ?? ""} maxLength={600} />
                <FField label="Target date" name="target_date" type="date" defaultValue={goal.targetDate ?? ""} />
                <div className="form-actions">
                  <SubmitButton variant="secondary" size="sm" pendingText="Saving…">Save the goal</SubmitButton>
                </div>
              </Form>
            </div>
          </details>
        </div>
      )}

      <UpdateList updates={updates} nameOf={nameOf} />
      <UpdateForm goalId={goal.id} label={writePrompt} />
    </Card>
  );
}

export function UpdateList({ updates, nameOf }: { updates: GoalUpdate[]; nameOf: (id: string) => string }) {
  if (updates.length === 0) return <Caption>Nothing written against this yet.</Caption>;
  return (
    <ul className="updates">
      {updates.map((u) => (
        <li key={u.id}>
          <span className="who">
            {nameOf(u.authorId)} · <time dateTime={u.createdAt}>{formatDayMonth(u.createdAt)}</time>
          </span>
          <span className="what">{u.body}</span>
        </li>
      ))}
    </ul>
  );
}

export function UpdateForm({ goalId, label }: { goalId: string; label: string }) {
  return (
    <Form action={addGoalUpdate} resetOnSuccess successNotice={false}>
      <input type="hidden" name="goal_id" value={goalId} />
      <FTextArea label={label} name="body" rows={2} maxLength={800} required placeholder="A line is enough." />
      <div className="form-actions">
        <SubmitButton variant="secondary" size="sm" pendingText="Writing…">Write it down</SubmitButton>
      </div>
    </Form>
  );
}

/** The most recent word written against a goal, for the front page. */
export function LatestUpdate({ updates, nameOf }: { updates: GoalUpdate[]; nameOf: (id: string) => string }) {
  const last = updates.at(-1);
  if (!last) return <Caption>Nothing written against this yet.</Caption>;
  return (
    <ul className="updates">
      <li>
        <span className="who">
          {nameOf(last.authorId)} · <time dateTime={last.createdAt}>{formatDayMonth(last.createdAt)}</time>
        </span>
        <span className="what">{last.body}</span>
      </li>
    </ul>
  );
}
