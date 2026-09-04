import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireViewer, canSeeSociety } from "@/lib/session";
import type { GoalBlock, Win } from "@/lib/domain";
import { formatDayMonth, formatLongDate } from "@/lib/weeks";
import { archiveWin, logWin } from "@/lib/actions/wins";
import { Caption, Card, EmptyState, Eyebrow, Field, HairlineList, HairlineRow, PageHeader, Section, Select, Stat, TextArea } from "@/components/ui";
import { Form, QuickAction, SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "The win log" };

export default async function WinsPage() {
  const { profile, repo, userId } = await requireViewer();
  if (!canSeeSociety(profile)) redirect("/upgrade");

  const [allWins, blocks] = await Promise.all([repo.listWins(userId, true), repo.listBlocks(userId)]);
  const active = blocks.find((b) => b.status === "active") ?? null;
  const live = allWins.filter((w) => !w.archivedAt);
  const archived = allWins.filter((w) => w.archivedAt);
  const blockById = new Map(blocks.map((b) => [b.id, b]));
  const thisBlock = active ? live.filter((w) => w.blockId === active.id).length : 0;

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="The Society"
        title="The win log"
        lede="Every win is logged and never deleted, only archived. On the hard weeks, read this."
      />

      <div className="stat-row" style={{ maxWidth: 420 }}>
        <Stat value={thisBlock} label="This block" sub={active ? active.title : "no block running"} tone="gold" />
        <Stat value={live.length} label="All time" sub={archived.length > 0 ? `${archived.length} archived` : undefined} />
      </div>

      <Card>
        <Eyebrow>Log a win</Eyebrow>
        <Form action={logWin} resetOnSuccess>
          {(state) => (
            <>
              <Field label="The win" name="title" required maxLength={140} placeholder="Treatment plan acceptance crossed 68%" error={state.errors.title} />
              <TextArea label="Detail" name="detail" rows={2} maxLength={600} placeholder="What made it happen, or what it made possible." error={state.errors.detail} />
              <div className="form-row">
                <Select
                  label="Block"
                  name="block_id"
                  options={blocks.map((b) => ({ value: b.id, label: b.title }))}
                  placeholder="Not part of a block"
                  defaultValue={active?.id ?? ""}
                  error={state.errors.block_id}
                  help="Wins belong to the block they came out of."
                />
              </div>
              <div className="form-actions">
                <SubmitButton size="sm" pendingText="Logging…">Log it</SubmitButton>
              </div>
            </>
          )}
        </Form>
      </Card>

      <Section title="The record">
        {live.length === 0 ? (
          <EmptyState title="Nothing logged yet.">
            The first win is usually smaller than you think it should be. Log it anyway.
          </EmptyState>
        ) : (
          <HairlineList>
            {live.map((w) => (
              <WinRow
                key={w.id}
                win={w}
                block={w.blockId ? blockById.get(w.blockId) ?? null : null}
                right={
                  <QuickAction action={archiveWin} fields={{ win_id: w.id }} confirm="Archive this win? It stays on the record.">
                    Archive
                  </QuickAction>
                }
              />
            ))}
          </HairlineList>
        )}
      </Section>

      {archived.length > 0 && (
        <details className="disclosure">
          <summary>Archived · {archived.length}</summary>
          <div className="disclosure-body">
            <HairlineList>
              {archived.map((w) => (
                <WinRow
                  key={w.id}
                  win={w}
                  block={w.blockId ? blockById.get(w.blockId) ?? null : null}
                  right={
                    <QuickAction action={archiveWin} fields={{ win_id: w.id, restore: "1" }}>
                      Restore
                    </QuickAction>
                  }
                />
              ))}
            </HairlineList>
          </div>
        </details>
      )}
    </div>
  );
}

function WinRow({ win, block, right }: { win: Win; block: GoalBlock | null; right: React.ReactNode }) {
  const meta = [win.detail, block ? block.title : null].filter(Boolean).join(" · ");
  return (
    <HairlineRow
      date={<time dateTime={win.createdAt} title={formatLongDate(win.createdAt)}>{formatDayMonth(win.createdAt)}</time>}
      title={win.title}
      meta={meta || <Caption>No detail given.</Caption>}
      right={right}
    />
  );
}
