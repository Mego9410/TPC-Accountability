import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireViewer, canSeeSociety } from "@/lib/session";
import { BLOCK_WEEKS, type Commitment, type GoalBlock } from "@/lib/domain";
import { memberSnapshot } from "@/lib/queries";
import { formatDayMonth, formatLongDate } from "@/lib/weeks";
import {
  BlockBadge, Button, Caption, Card, EmptyState, Eyebrow, H3, HairlineList, HairlineRow, PageHeader, Section, Stat, WeekStrip,
} from "@/components/ui";

export const metadata: Metadata = { title: "Goal blocks" };

function count(cs: Commitment[], status: Commitment["status"]) {
  return cs.filter((c) => c.status === status).length;
}

export default async function BlocksPage() {
  const { profile, repo, userId } = await requireViewer();
  if (!canSeeSociety(profile)) redirect("/upgrade");

  const [blocks, snap, allCommitments] = await Promise.all([
    repo.listBlocks(userId),
    memberSnapshot(repo, profile),
    repo.listCommitmentsFor([userId]),
  ]);
  const active = snap.block;
  const past = blocks.filter((b) => b.id !== active?.id);
  const byBlock = new Map<string, Commitment[]>();
  for (const c of allCommitments) {
    const list = byBlock.get(c.blockId) ?? [];
    list.push(c);
    byBlock.set(c.blockId, list);
  }

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="The Society"
        title="Goal blocks"
        lede="Twelve weeks, one outcome, and beneath it the small things you said you would do each week. A goal kept is struck through."
        actions={<Button href="/blocks/new" size="sm">Start a block</Button>}
      />

      {active && snap.week ? (
        <Section title={`Active · week ${snap.week} of ${BLOCK_WEEKS}`}>
          <Card emphasis as="article">
            <div className="row between wrap items-start">
              <div>
                <H3>{active.title}</H3>
                {active.description && <Caption>{active.description}</Caption>}
              </div>
              <BlockBadge status={active.status} />
            </div>
            <Caption>
              Started <time dateTime={active.startDate}>{formatLongDate(active.startDate)}</time>, ends <time dateTime={active.endDate}>{formatLongDate(active.endDate)}</time>.
            </Caption>
            <WeekStrip current={snap.week} weekStatus={snap.weekStatus} />
            <div className="stat-row">
              <Stat value={count(snap.commitments, "done")} label="Kept" tone="ok" />
              <Stat value={count(snap.commitments, "missed")} label="Missed" tone={count(snap.commitments, "missed") > 0 ? "warn" : undefined} />
              <Stat value={count(snap.commitments, "carried")} label="Carried" />
              <Stat value={snap.openThisWeek} label="Open this week" sub={snap.openThisWeek === 0 && snap.thisWeek.length > 0 ? "all kept" : undefined} />
            </div>
            <div className="row gap-4 wrap">
              <Button href={`/blocks/${active.id}`} size="sm" variant="secondary">Open the block</Button>
              {snap.openThisWeek === 0 && snap.thisWeek.length === 0 && <Caption>Nothing is set down for this week yet.</Caption>}
            </div>
          </Card>
        </Section>
      ) : (
        <Card emphasis>
          <Eyebrow>No active block</Eyebrow>
          <H3>Begin a twelve-week block.</H3>
          <Caption>Pick a template or write your own outcome. Each week you set down one or two commitments and say whether you kept them.</Caption>
          <div className="row" style={{ marginTop: 6 }}>
            <Button href="/blocks/new" size="sm">Start a block</Button>
          </div>
        </Card>
      )}

      <Section title="Past blocks">
        {past.length === 0 ? (
          <EmptyState title="No past blocks yet.">
            When a block closes it stays here, with everything you kept and everything you did not.
          </EmptyState>
        ) : (
          <HairlineList>
            {past.map((b) => <PastRow key={b.id} block={b} commitments={byBlock.get(b.id) ?? []} />)}
          </HairlineList>
        )}
      </Section>
    </div>
  );
}

function PastRow({ block, commitments }: { block: GoalBlock; commitments: Commitment[] }) {
  const kept = count(commitments, "done");
  const set = commitments.filter((c) => c.status !== "carried").length;
  return (
    <HairlineRow
      href={`/blocks/${block.id}`}
      date={
        <>
          <time dateTime={block.startDate}>{formatDayMonth(block.startDate)}</time> – <time dateTime={block.endDate}>{formatDayMonth(block.endDate)}</time>
        </>
      }
      title={block.title}
      meta={block.description ?? `Started ${formatLongDate(block.startDate)}.`}
      right={
        <>
          <Caption>{kept} of {set} kept</Caption>
          <BlockBadge status={block.status} />
        </>
      }
    />
  );
}
