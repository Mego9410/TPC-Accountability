import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { subMonths } from "date-fns";
import { requireViewer, canSeeSociety } from "@/lib/session";
import { BLOCK_WEEKS, type Commitment, type GoalBlock } from "@/lib/domain";
import { memberSnapshot, weekStatusMap } from "@/lib/queries";
import { clampWeek, currentBlockWeek, formatDayMonth, formatLongDate, weekLabel } from "@/lib/weeks";
import { BlockBadge, Caption, Card, EmptyState, Eyebrow, H3, PageHeader, Section, Sparkline, Stat, WeekStrip } from "@/components/ui";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Quarterly review" };

type Range = "quarter" | "year";

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { profile, repo, userId } = await requireViewer();
  if (!canSeeSociety(profile)) redirect("/upgrade");
  const params = await searchParams;
  const range: Range = params.range === "year" ? "year" : "quarter";
  const now = new Date();
  const since = subMonths(now, range === "year" ? 12 : 3);
  const sinceISO = since.toISOString();
  const sinceDay = sinceISO.slice(0, 10);

  const [snap, blocks, allCommitments, wins] = await Promise.all([
    memberSnapshot(repo, profile),
    repo.listBlocks(userId),
    repo.listCommitmentsFor([userId]),
    repo.listWins(userId),
  ]);

  const checkIns = snap.checkIns.filter((c) => c.completedAt >= sinceISO);
  const periodBlocks = blocks.filter((b) => b.endDate >= sinceDay && b.startDate <= now.toISOString().slice(0, 10));
  const periodBlockIds = new Set(periodBlocks.map((b) => b.id));
  const elapsedWeek = (b: GoalBlock) => (b.status === "completed" ? BLOCK_WEEKS : clampWeek(currentBlockWeek(b, now)));
  const set = allCommitments.filter((c) => {
    if (!periodBlockIds.has(c.blockId) || c.status === "carried") return false;
    const b = periodBlocks.find((x) => x.id === c.blockId);
    return b ? c.week <= elapsedWeek(b) : false;
  });
  const kept = set.filter((c) => c.status === "done").length;
  const periodWins = wins.filter((w) => w.createdAt >= sinceISO);
  const energies = [...checkIns].reverse().map((c) => c.energy).filter((e): e is number => e != null);
  const avgEnergy = energies.length > 0 ? Math.round((energies.reduce((a, b) => a + b, 0) / energies.length) * 10) / 10 : null;
  const struggles = checkIns.filter((c) => c.struggledWith);

  const label = range === "year" ? "The last twelve months" : "The last three months";

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow={<>{label} · from <time dateTime={sinceDay}>{formatLongDate(sinceDay)}</time></>}
        title="Quarterly review"
        lede="What you set down, what you kept, and what you said about it at the time. Read it before you plan the next block."
        actions={<PrintButton />}
      />

      <nav className="range-toggle" aria-label="Period">
        <Link href="/review?range=quarter" aria-current={range === "quarter" ? "page" : undefined}>Quarter</Link>
        <Link href="/review?range=year" aria-current={range === "year" ? "page" : undefined}>Year</Link>
      </nav>

      <div className="stat-row">
        <Stat value={checkIns.length} label="Check-ins" sub="in the period" />
        <Stat value={snap.streak} label="Week streak" sub="running now" />
        <Stat value={`${kept}/${set.length}`} label="Kept" sub="commitments set" tone={set.length > 0 && kept / set.length >= 0.6 ? "ok" : undefined} />
        <Stat value={periodWins.length} label="Wins" sub="logged" tone="gold" />
        <Stat value={snap.score} label="Consistency" sub="of 100" />
      </div>

      <Section title="Blocks in the period">
        {periodBlocks.length === 0 ? (
          <EmptyState title="No block ran in this period.">
            Twelve weeks starts with one outcome. Start a block and the review fills itself in.
          </EmptyState>
        ) : (
          <div className="card-grid">
            {periodBlocks.map((b) => <BlockCard key={b.id} block={b} commitments={allCommitments.filter((c) => c.blockId === b.id)} current={elapsedWeek(b)} />)}
          </div>
        )}
      </Section>

      <div className="grid-even">
        <Section title="Highlights">
          {periodWins.length === 0 ? (
            <EmptyState title="No wins logged.">Log them as they happen; a review with nothing in this column is rarely a true account.</EmptyState>
          ) : (
            <ul className="quiet-list">
              {periodWins.map((w) => (
                <li key={w.id}>
                  <time className="when" dateTime={w.createdAt}>{formatDayMonth(w.createdAt)}</time>
                  <span>
                    {w.title}
                    {w.detail && <Caption>{w.detail}</Caption>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Energy">
          <Card>
            {energies.length < 2 ? (
              <>
                <H3>Not enough check-ins to draw a line.</H3>
                <Caption>Two or more check-ins in the period and your energy over time appears here.</Caption>
              </>
            ) : (
              <>
                <Sparkline values={energies} width={320} height={72} />
                <Caption>
                  Average {avgEnergy} of 10 across {energies.length} check-ins, oldest to newest. Lowest {Math.min(...energies)}, highest {Math.max(...energies)}.
                </Caption>
              </>
            )}
          </Card>
        </Section>
      </div>

      <Section title="What you said you struggled with">
        {struggles.length === 0 ? (
          <EmptyState title="Nothing recorded.">Either the weeks were clean or the question went unanswered. Both are worth knowing.</EmptyState>
        ) : (
          <ul className="quiet-list">
            {struggles.map((c) => (
              <li key={c.id}>
                <time className="when" dateTime={c.completedAt}>{weekLabel(c.weekKey)}</time>
                <span>{c.struggledWith}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function BlockCard({ block, commitments, current }: { block: GoalBlock; commitments: Commitment[]; current: number }) {
  const counted = commitments.filter((c) => c.status !== "carried");
  const kept = counted.filter((c) => c.status === "done").length;
  const missed = counted.filter((c) => c.status === "missed").length;
  return (
    <Card as="article" pad="sm">
      <div className="row between wrap items-start">
        <Eyebrow>
          <time dateTime={block.startDate}>{formatDayMonth(block.startDate)}</time> – <time dateTime={block.endDate}>{formatDayMonth(block.endDate)}</time>
        </Eyebrow>
        <BlockBadge status={block.status} />
      </div>
      <H3>{block.title}</H3>
      <WeekStrip current={current} weekStatus={weekStatusMap(commitments, current)} compact />
      <Caption>{kept} kept · {missed} missed · {counted.length} set down</Caption>
    </Card>
  );
}
