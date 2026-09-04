import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/session";
import { BLOCK_WEEKS, firstName, menteesOf, type CircleWithMembers } from "@/lib/domain";
import { memberSnapshot } from "@/lib/queries";
import { formatAppointment, formatDayMonth, formatLongDate, formatShortDate, relativeDays, weekLabel } from "@/lib/weeks";
import { YEARS_AS_PRINCIPAL } from "@/lib/options";
import { addNote } from "@/lib/actions/notes";
import {
  Badge, Button, Caption, Card, CommitmentBadge, EmptyState, Eyebrow, H3, HairlineList, HairlineRow, PageHeader, Section, Stat, TextArea, TextLink, WeekStrip,
} from "@/components/ui";
import { Form, SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "Your mentee" };

function yearsLabel(years: number | null): string | null {
  if (years == null) return null;
  let label: string | null = null;
  for (const o of YEARS_AS_PRINCIPAL) if (years >= o.value) label = o.label;
  return label ? `${label.charAt(0).toLowerCase()}${label.slice(1)} as a principal` : null;
}

export default async function MenteePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile: viewer, repo, userId } = await requireViewer({ roles: ["mentor", "staff"] });

  const [mentee, circles] = await Promise.all([repo.getProfile(id), repo.listCirclesFor(userId)]);
  if (!mentee) notFound();
  const isMine = menteesOf(circles, userId).some((m) => m.id === mentee.id);
  if (!isMine && viewer.role !== "staff") notFound();

  const shared: CircleWithMembers | undefined =
    circles.find((c) => c.kind === "pair" && c.members.some((m) => m.userId === mentee.id)) ??
    circles.find((c) => c.members.some((m) => m.userId === mentee.id));
  const seat = shared?.members.find((m) => m.userId === mentee.id) ?? null;

  const [snap, wins, allNotes, allCommitments, sittings] = await Promise.all([
    memberSnapshot(repo, mentee),
    repo.listWins(mentee.id),
    repo.listNotesAbout(mentee.id),
    repo.listCommitmentsFor([mentee.id]),
    shared ? repo.listSittings([shared.id]) : Promise.resolve([]),
  ]);
  const notes = allNotes.filter((n) => n.authorId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const commitmentText = new Map(allCommitments.map((c) => [c.id, c.text]));
  const checkInWeek = new Map(snap.checkIns.map((c) => [c.id, c.weekKey]));

  const now = Date.now();
  const nextSitting = sittings
    .filter((s) => s.status === "scheduled" && new Date(s.scheduledAt).getTime() > now - 3_600_000)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  const pastSittings = sittings
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    .slice(0, 2);

  const first = firstName(mentee);
  const ledeParts = [
    mentee.practiceName,
    mentee.region,
    mentee.chairCount ? `${mentee.chairCount} ${mentee.chairCount === 1 ? "chair" : "chairs"}` : null,
    yearsLabel(mentee.yearsAsPrincipal),
  ].filter((p): p is string => Boolean(p));

  const kept = snap.commitments.filter((c) => c.status === "done").length;
  const missed = snap.commitments.filter((c) => c.status === "missed").length;
  const carried = snap.commitments.filter((c) => c.status === "carried").length;

  return (
    <div className="section fade-enter">
      <TextLink href="/mentor" back>All mentees</TextLink>
      <PageHeader
        eyebrow={
          seat ? (
            <>
              {shared?.kind === "pair" ? "Your mentee" : "In your pod"} · since <time dateTime={seat.joinedAt}>{formatLongDate(seat.joinedAt)}</time>
            </>
          ) : (
            "A principal"
          )
        }
        title={mentee.fullName}
        lede={
          <>
            {ledeParts.length > 0 ? `${ledeParts.join(" · ")}.` : "No practice details given yet."}
            {mentee.focusAreas.length > 0 && (
              <span className="row gap-2 wrap" style={{ marginTop: 12 }}>
                {mentee.focusAreas.map((f) => <Badge key={f} dot={false}>{f}</Badge>)}
              </span>
            )}
          </>
        }
        actions={<Button href={`/messages?circle=${shared?.id ?? ""}`} size="sm" variant="secondary">Write a note</Button>}
      />

      <div className="grid-sidebar">
        <div className="stack gap-8">
          <Section title="This week">
            <Card emphasis={!snap.checkedInThisWeek}>
              <div className="row between wrap">
                <div>
                  <H3>{snap.checkedInThisWeek ? `${first} has checked in.` : `${first} has not checked in yet.`}</H3>
                  <Caption>
                    {snap.checkedInThisWeek && snap.latestCheckIn
                      ? `Logged for ${weekLabel(snap.latestCheckIn.weekKey)}. Energy ${snap.latestCheckIn.energy ?? "—"} of 10.`
                      : snap.latestCheckIn
                        ? `Last check-in was ${weekLabel(snap.latestCheckIn.weekKey)}.`
                        : "No check-in on the record."}
                  </Caption>
                </div>
                <div className="stat-row">
                  <Stat value={snap.streak} label="Streak" sub="weeks" />
                  <Stat value={snap.score} label="Consistency" sub="of 100" tone="gold" />
                </div>
              </div>
            </Card>

            {snap.block ? (
              snap.thisWeek.length > 0 ? (
                <div>
                  {snap.thisWeek.map((c) => (
                    <div key={c.id} className={`commitment ${c.status}`}>
                      <div className="cm-week">Wk {c.week}</div>
                      <div>
                        <div className="cm-text">{c.text}</div>
                        {c.carriedFrom && <div className="cm-meta">Carried from an earlier week.</div>}
                      </div>
                      <div className="cm-actions"><CommitmentBadge status={c.status} /></div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title={`Nothing set down for week ${snap.week}.`}>
                  {first} has not written a commitment for this week. It may be worth a line before you sit.
                </EmptyState>
              )
            ) : null}
          </Section>

          <Section title="The block" aside={snap.block && <TextLink href={`/blocks/${snap.block.id}`}>The whole block</TextLink>}>
            {snap.block && snap.week ? (
              <Card>
                <Eyebrow>Week {snap.week} of {BLOCK_WEEKS}</Eyebrow>
                <H3>{snap.block.title}</H3>
                {snap.block.description && <Caption>{snap.block.description}</Caption>}
                <WeekStrip current={snap.week} weekStatus={snap.weekStatus} />
                <Caption>{kept} kept · {missed} missed · {carried} carried</Caption>
              </Card>
            ) : (
              <EmptyState title="No block running.">
                {first} has not begun a twelve-week block. The first sitting of a block is the best one to attend.
              </EmptyState>
            )}
          </Section>

          <Section title="Check-ins">
            {snap.checkIns.length === 0 ? (
              <EmptyState title="No check-ins yet.">The record begins the first Monday {first} answers the four questions.</EmptyState>
            ) : (
              <div className="feed">
                {snap.checkIns.slice(0, 6).map((ci) => (
                  <article key={ci.id} className="feed-item">
                    <div className="feed-when">
                      <time dateTime={ci.completedAt}>{weekLabel(ci.weekKey)}</time>
                    </div>
                    <div>
                      <div className="feed-head">
                        <span className="feed-who">{ci.blockWeek ? `Block week ${ci.blockWeek}` : "Between blocks"}</span>
                        <span className="feed-when">Energy {ci.energy ?? "—"} of 10</span>
                      </div>
                      <div className="feed-body">
                        <dl>
                          <dt>Went well</dt><dd>{ci.didWell ?? "—"}</dd>
                          <dt>Struggled</dt><dd>{ci.struggledWith ?? "Nothing noted."}</dd>
                          <dt>Next</dt><dd>{ci.nextFocus ?? "—"}</dd>
                        </dl>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Section>

          <Section title="Wins">
            {wins.length === 0 ? (
              <EmptyState title="No wins logged.">When {first} logs one it appears here, so you can mark it at the next sitting.</EmptyState>
            ) : (
              <HairlineList>
                {wins.slice(0, 6).map((w) => (
                  <HairlineRow key={w.id} date={<time dateTime={w.createdAt}>{formatDayMonth(w.createdAt)}</time>} title={w.title} meta={w.detail ?? undefined} />
                ))}
              </HairlineList>
            )}
          </Section>

          <Section title="Your notes">
            {notes.length === 0 ? (
              <EmptyState title="You have left no notes.">Notes are for your own record between sittings. {first} does not see them.</EmptyState>
            ) : (
              <div className="feed">
                {notes.map((n) => (
                  <article key={n.id} className="feed-item">
                    <div className="feed-when">
                      <time dateTime={n.createdAt}>{formatDayMonth(n.createdAt)}</time>
                    </div>
                    <div>
                      <div className="feed-body">{n.body}</div>
                      {n.commitmentId && commitmentText.has(n.commitmentId) && (
                        <Caption style={{ marginTop: 6 }}>On the commitment “{commitmentText.get(n.commitmentId)}”.</Caption>
                      )}
                      {n.checkInId && checkInWeek.has(n.checkInId) && (
                        <Caption style={{ marginTop: 6 }}>On the check-in for {weekLabel(checkInWeek.get(n.checkInId) ?? "")}.</Caption>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            <Card pad="sm">
              <Form action={addNote} resetOnSuccess>
                <input type="hidden" name="about_user_id" value={mentee.id} />
                <TextArea label={`A note about ${first}`} name="body" rows={3} maxLength={1000} placeholder="What you noticed, and what to raise at the next sitting." required />
                <div className="form-actions">
                  <SubmitButton size="sm">Leave a note</SubmitButton>
                </div>
              </Form>
            </Card>
          </Section>
        </div>

        <div className="stack gap-6">
          <Card>
            <Eyebrow>Sittings with {first}</Eyebrow>
            {nextSitting ? (
              <>
                <H3><time dateTime={nextSitting.scheduledAt}>{formatAppointment(nextSitting.scheduledAt)}</time></H3>
                <Caption>{relativeDays(nextSitting.scheduledAt)}{shared?.kind === "pod" ? ` · ${shared.name}` : ""}</Caption>
                <div className="row gap-4 wrap" style={{ marginTop: 6 }}>
                  <Button href={`/sittings/${nextSitting.id}`} size="sm">Prepare</Button>
                  <TextLink href="/calendar">All sittings</TextLink>
                </div>
              </>
            ) : (
              <>
                <H3>No sitting in the diary.</H3>
                <div className="row" style={{ marginTop: 6 }}>
                  <Button href="/calendar" size="sm" variant="secondary">Arrange a sitting</Button>
                </div>
              </>
            )}
            {pastSittings.length > 0 && (
              <div className="feed">
                {pastSittings.map((s) => (
                  <article key={s.id} className="feed-item">
                    <div className="feed-when"><time dateTime={s.scheduledAt}>{formatShortDate(s.scheduledAt)}</time></div>
                    <Caption>{s.notes ?? "No notes were kept."}</Caption>
                  </article>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <Eyebrow>Correspondence</Eyebrow>
            <H3>Write to {first}.</H3>
            <Caption>Anything said between sittings is kept in your correspondence.</Caption>
            <div className="row" style={{ marginTop: 6 }}>
              <Button href={`/messages?circle=${shared?.id ?? ""}`} size="sm" variant="secondary">Write a note</Button>
            </div>
          </Card>

          {mentee.bio && (
            <Card>
              <Eyebrow>In {first}&rsquo;s words</Eyebrow>
              <Caption>{mentee.bio}</Caption>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
