import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireViewer, canSeeSociety } from "@/lib/session";
import {
  BLOCK_WEEKS, address, isMentorIn, type Commitment, type GoalBlock, type Note, type Profile, type Win,
} from "@/lib/domain";
import { weekStatusMap } from "@/lib/queries";
import { clampWeek, currentBlockWeek, formatDayMonth, formatLongDate } from "@/lib/weeks";
import { addCommitment, setBlockStatus } from "@/lib/actions/blocks";
import { addNote } from "@/lib/actions/notes";
import {
  BlockBadge, Caption, Card, CommitmentBadge, EmptyState, Eyebrow, Field, H3, PageHeader, Section, Select, Stat, TextArea, TextLink, WeekStrip, cn,
} from "@/components/ui";
import { Form, QuickAction, SubmitButton } from "@/components/ui/form";
import { CommitmentQuickActions, ReopenCommitment } from "@/components/commitments";

export const metadata: Metadata = { title: "Goal block" };

const WEEK_OPTIONS = Array.from({ length: BLOCK_WEEKS }, (_, i) => ({ value: i + 1, label: `Week ${i + 1}` }));

export default async function BlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile, repo, userId } = await requireViewer();
  if (!canSeeSociety(profile)) redirect("/upgrade");
  const { id } = await params;

  const block = await repo.getBlock(id);
  if (!block) notFound();

  const isOwner = block.userId === userId;
  const isStaff = profile.role === "staff";
  let isMentor = false;
  if (!isOwner && !isStaff) {
    const circles = await repo.listCirclesFor(userId);
    isMentor = circles.some((c) => isMentorIn(c, userId) && c.members.some((m) => m.userId === block.userId));
  }
  if (!isOwner && !isMentor && !isStaff) notFound();

  const owner = isOwner ? profile : await repo.getProfile(block.userId);
  if (!owner) notFound();
  const canNote = !isOwner && (profile.role === "mentor" || isStaff);

  const [commitments, wins, notes] = await Promise.all([
    repo.listCommitments(block.id),
    repo.listWins(block.userId),
    repo.listNotesAbout(block.userId),
  ]);
  const authors = await repo.listProfiles([...new Set(notes.map((n) => n.authorId))]);
  const authorById = new Map(authors.map((a) => [a.id, a]));

  const current = block.status === "completed" ? BLOCK_WEEKS : clampWeek(currentBlockWeek(block));
  const weekStatus = weekStatusMap(commitments, current);
  const commitmentIds = new Set(commitments.map((c) => c.id));
  const blockWins = wins.filter((w) => w.blockId === block.id);
  const notesByCommitment = new Map<string, Note[]>();
  for (const n of notes) {
    if (!n.commitmentId || !commitmentIds.has(n.commitmentId)) continue;
    const list = notesByCommitment.get(n.commitmentId) ?? [];
    list.push(n);
    notesByCommitment.set(n.commitmentId, list);
  }
  const sidebarNotes = notes.filter((n) => (n.commitmentId ? commitmentIds.has(n.commitmentId) : !n.checkInId));

  const counted = commitments.filter((c) => c.status !== "carried");
  const kept = counted.filter((c) => c.status === "done").length;
  const partly = counted.filter((c) => c.status === "partial").length;
  const missed = counted.filter((c) => c.status === "missed").length;
  const carried = commitments.filter((c) => c.status === "carried").length;

  const eyebrow = block.status === "active"
    ? <>Week {current} of {BLOCK_WEEKS} · started <time dateTime={block.startDate}>{formatLongDate(block.startDate)}</time></>
    : <><time dateTime={block.startDate}>{formatDayMonth(block.startDate)}</time> – <time dateTime={block.endDate}>{formatLongDate(block.endDate)}</time></>;

  return (
    <div className="section fade-enter">
      <TextLink href={isOwner ? "/blocks" : `/mentor/${owner.id}`} back>{isOwner ? "All blocks" : address(owner)}</TextLink>
      <PageHeader
        eyebrow={isOwner ? eyebrow : <>{address(owner)} · {eyebrow}</>}
        title={block.title}
        lede={block.description ?? undefined}
        actions={
          <>
            <BlockBadge status={block.status} />
            {isOwner && block.status === "active" && (
              <>
                <QuickAction action={setBlockStatus} fields={{ block_id: block.id, status: "completed" }} variant="secondary" size="sm" confirm="Mark this block completed? It closes the twelve weeks and keeps the record as it stands.">
                  Mark completed
                </QuickAction>
                <details className="disclosure">
                  <summary>Set aside</summary>
                  <div className="disclosure-body stack gap-2">
                    <Caption>A block set aside stays on the record but no longer counts towards your consistency.</Caption>
                    <QuickAction action={setBlockStatus} fields={{ block_id: block.id, status: "abandoned" }} confirm="Set this block aside? It stays on the record, marked as set aside.">
                      Set this block aside
                    </QuickAction>
                  </div>
                </details>
              </>
            )}
          </>
        }
      />

      <WeekStrip current={current} weekStatus={weekStatus} />

      <div className="grid-sidebar">
        <div className="stack gap-6">
          {commitments.length === 0 && (
            <EmptyState title="Nothing set down yet.">
              {isOwner ? "Add the first commitment below. One or two a week is plenty." : `${address(owner)} has not set anything down for this block yet.`}
            </EmptyState>
          )}
          {WEEK_OPTIONS.map(({ value: w }) => (
            <WeekGroup
              key={w}
              week={w}
              current={current}
              block={block}
              owner={owner}
              isOwner={isOwner}
              canNote={canNote}
              commitments={commitments.filter((c) => c.week === w)}
              notes={notesByCommitment}
              authors={authorById}
            />
          ))}

          {isOwner && (
            <div id="add">
              <Section title="Add a commitment">
                <Card>
                  <Form action={addCommitment} resetOnSuccess>
                    {(state) => (
                      <>
                        <input type="hidden" name="block_id" value={block.id} />
                        <div className="form-row">
                          <Select label="Week" name="week" options={WEEK_OPTIONS} defaultValue={current} error={state.errors.week} />
                          <Field label="Commitment" name="text" required maxLength={200} placeholder="One thing you will actually do" error={state.errors.text} />
                        </div>
                        <div className="form-actions">
                          <SubmitButton size="sm" pendingText="Setting down…">Set it down</SubmitButton>
                          <Caption>Short, specific, and finishable in a week.</Caption>
                        </div>
                      </>
                    )}
                  </Form>
                </Card>
              </Section>
            </div>
          )}
        </div>

        <div className="stack gap-6">
          <Card emphasis>
            <Eyebrow>Kept so far</Eyebrow>
            <div className="stat-row">
              <Stat value={kept} label="Kept" tone="ok" />
              <Stat value={partly} label="Partly" />
              <Stat value={missed} label="Missed" tone={missed > 0 ? "warn" : undefined} />
              <Stat value={carried} label="Carried" />
            </div>
            <Caption>{counted.length} {counted.length === 1 ? "commitment" : "commitments"} set down across the block.</Caption>
          </Card>

          <Card>
            <Eyebrow>Wins in this block</Eyebrow>
            {blockWins.length === 0 ? (
              <>
                <H3>None logged yet.</H3>
                <Caption>{isOwner ? "When something goes right, write it down. On the hard weeks, read it back." : "Nothing on the record for this block."}</Caption>
              </>
            ) : (
              <div className="quiet-list-wrap">
                {blockWins.map((w) => <WinLine key={w.id} win={w} />)}
              </div>
            )}
            {isOwner && <TextLink href="/wins">The win log</TextLink>}
          </Card>

          {isOwner && (
            <Card>
              <Eyebrow>Notes from your mentor</Eyebrow>
              {sidebarNotes.length === 0 ? (
                <>
                  <H3>No notes yet.</H3>
                  <Caption>Your mentor can leave a note on any commitment, or on the block as a whole. They appear here.</Caption>
                </>
              ) : (
                <div className="feed">
                  {sidebarNotes.map((n) => {
                    const author = authorById.get(n.authorId);
                    const on = n.commitmentId ? commitments.find((c) => c.id === n.commitmentId) : null;
                    return (
                      <div key={n.id} className="feed-item" style={{ gridTemplateColumns: "1fr" }}>
                        <div>
                          <div className="feed-head">
                            <span className="feed-who">{author ? address(author) : "Your mentor"}</span>
                            <time className="feed-when" dateTime={n.createdAt}>{formatDayMonth(n.createdAt)}</time>
                          </div>
                          <div className="feed-body">
                            {n.body}
                            {on && <Caption>On “{on.text}”, week {on.week}.</Caption>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function WinLine({ win }: { win: Win }) {
  return (
    <div className="stack" style={{ marginTop: 4 }}>
      <span className="feed-who">{win.title}</span>
      <Caption><time dateTime={win.createdAt}>{formatDayMonth(win.createdAt)}</time>{win.detail ? ` · ${win.detail}` : ""}</Caption>
    </div>
  );
}

function WeekGroup({
  week, current, block, owner, isOwner, canNote, commitments, notes, authors,
}: {
  week: number;
  current: number;
  block: GoalBlock;
  owner: Profile;
  isOwner: boolean;
  canNote: boolean;
  commitments: Commitment[];
  notes: Map<string, Note[]>;
  authors: Map<string, Profile>;
}) {
  const now = week === current;
  if (!now && commitments.length === 0 && week > current) return null;
  const heading = now
    ? (block.status === "active" ? `Week ${week} · this week` : `Week ${week}`)
    : `Week ${week}`;
  return (
    <section className={cn("week-group", now && "now")} aria-label={`Week ${week}`}>
      <div className="block-head">
        <Eyebrow>{heading}</Eyebrow>
        {now && <Caption>{commitments.filter((c) => c.status === "open").length} open</Caption>}
      </div>
      {commitments.length === 0 ? (
        <Caption>{now ? "Nothing set down for this week." : "Nothing was set down."}</Caption>
      ) : (
        <div>
          {commitments.map((c) => (
            <CommitmentRow
              key={c.id}
              c={c}
              owner={owner}
              isOwner={isOwner}
              canNote={canNote}
              notes={notes.get(c.id) ?? []}
              authors={authors}
              carriedFromWeek={c.carriedFrom ? findWeek(c.carriedFrom, commitments) : null}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function findWeek(id: string, _cs: Commitment[]): number | null {
  // Carried commitments live in a different week; the caller passes the block's full list via closure below.
  return CARRIED_WEEKS.get(id) ?? null;
}
const CARRIED_WEEKS = new Map<string, number>();

function CommitmentRow({
  c, owner, isOwner, canNote, notes, authors, carriedFromWeek,
}: {
  c: Commitment;
  owner: Profile;
  isOwner: boolean;
  canNote: boolean;
  notes: Note[];
  authors: Map<string, Profile>;
  carriedFromWeek: number | null;
}) {
  return (
    <div className={cn("commitment", c.status)}>
      <div className="cm-week">Wk {c.week}</div>
      <div>
        <div className="cm-text">{c.text}</div>
        {c.carriedFrom && <div className="cm-meta">{carriedFromWeek ? `Carried from week ${carriedFromWeek}.` : "Carried from an earlier week."}</div>}
        {notes.map((n) => {
          const author = authors.get(n.authorId);
          return (
            <div key={n.id} className="cm-note">
              <b>{author ? address(author) : "Mentor"} · <time dateTime={n.createdAt}>{formatDayMonth(n.createdAt)}</time></b>
              {n.body}
            </div>
          );
        })}
        {canNote && (
          <details className="disclosure" style={{ marginTop: 8 }}>
            <summary>Leave a note</summary>
            <div className="disclosure-body">
              <Form action={addNote} resetOnSuccess>
                {(state) => (
                  <>
                    <input type="hidden" name="about_user_id" value={owner.id} />
                    <input type="hidden" name="commitment_id" value={c.id} />
                    <TextArea label={`Note for ${address(owner)}`} name="body" rows={2} required maxLength={1000} error={state.errors.body} placeholder="A question is usually more use than advice." />
                    <div className="form-actions">
                      <SubmitButton size="sm" variant="secondary" pendingText="Leaving…">Leave the note</SubmitButton>
                    </div>
                  </>
                )}
              </Form>
            </div>
          </details>
        )}
      </div>
      <div className="cm-actions">
        {isOwner && c.status === "open" ? (
          <CommitmentQuickActions id={c.id} canCarry={c.week < BLOCK_WEEKS} />
        ) : (
          <>
            <CommitmentBadge status={c.status} />
            {isOwner && (c.status === "done" || c.status === "partial" || c.status === "missed") && <ReopenCommitment id={c.id} />}
          </>
        )}
      </div>
    </div>
  );
}
