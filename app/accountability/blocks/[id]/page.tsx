import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { requireUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isPreviewMode } from "@/lib/preview";
import { demoCommitments, demoGoalBlock } from "@/lib/accountability-demo";
import { Badge, Body, Button, Card, Caption, Divider, Eyebrow, H1 } from "@/components/ui";
import { AddCommitmentForm } from "@/components/accountability/add-commitment-form";
import {
  carryCommitment,
  editCommitment,
  setCommitmentStatus,
  setGoalBlockStatus,
} from "@/lib/actions/accountability";
import { BLOCK_WEEKS, clampWeek, currentBlockWeek } from "@/lib/accountability";
import type { Commitment, CommitmentStatus, GoalBlock } from "@/lib/types";

export const metadata: Metadata = { title: "A goal block" };

const STATUS_VARIANT: Record<CommitmentStatus, string> = {
  open: "",
  done: "gold",
  partial: "",
  missed: "",
  carried: "",
};

export default async function BlockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUserProfile();

  let b: GoalBlock;
  let commitments: Commitment[];

  if (await isPreviewMode()) {
    b = demoGoalBlock;
    commitments = demoCommitments;
  } else {
    const supabase = await createClient();
    const { data: block } = await supabase.from("goal_blocks").select("*").eq("id", id).maybeSingle();
    if (!block) notFound();
    b = block as GoalBlock;

    const { data: commitmentRows } = await supabase
      .from("commitments")
      .select("*")
      .eq("goal_block_id", id)
      .order("week_number", { ascending: true })
      .order("created_at", { ascending: true });
    commitments = (commitmentRows ?? []) as Commitment[];
  }

  const currentWeek = clampWeek(currentBlockWeek(b));
  const byWeek = new Map<number, Commitment[]>();
  for (const c of commitments) {
    byWeek.set(c.week_number, [...(byWeek.get(c.week_number) ?? []), c]);
  }

  return (
    <div className="section fade-enter">
      <Link
        href="/accountability/blocks"
        style={{
          font: "500 10px/1 var(--font-sans)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--tpc-gold-deep)",
          textDecoration: "none",
        }}
      >
        ← All blocks
      </Link>

      <div className="row between" style={{ alignItems: "flex-start", marginTop: 12 }}>
        <div>
          <Eyebrow>Twelve-week block</Eyebrow>
          <H1>{b.title}</H1>
        </div>
        <Badge variant={b.status === "active" ? "gold" : ""}>{b.status}</Badge>
      </div>

      {b.description && (
        <Body className="muted" style={{ maxWidth: 620, marginTop: 8 }}>
          {b.description}
        </Body>
      )}
      <Caption style={{ marginTop: 8 }}>
        {format(new Date(`${b.start_date}T00:00:00`), "d MMM yyyy")} —{" "}
        {format(new Date(`${b.end_date}T00:00:00`), "d MMM yyyy")}
        {b.status === "active" ? ` · week ${currentWeek} of ${BLOCK_WEEKS}` : ""}
      </Caption>

      {b.status === "active" && (
        <div className="row gap-4" style={{ marginTop: 12 }}>
          <form action={setGoalBlockStatus}>
            <input type="hidden" name="block_id" value={b.id} />
            <input type="hidden" name="status" value="completed" />
            <Button type="submit" variant="secondary" size="sm">
              Mark block complete
            </Button>
          </form>
          <form action={setGoalBlockStatus}>
            <input type="hidden" name="block_id" value={b.id} />
            <input type="hidden" name="status" value="abandoned" />
            <Button type="submit" variant="ghost" size="sm">
              Abandon
            </Button>
          </form>
        </div>
      )}

      <Divider />

      <Card emphasis>
        <Eyebrow>Add a commitment</Eyebrow>
        <div style={{ marginTop: 12 }}>
          <AddCommitmentForm blockId={b.id} defaultWeek={currentWeek} />
        </div>
      </Card>

      <div className="stack gap-6" style={{ marginTop: 28 }}>
        {Array.from({ length: BLOCK_WEEKS }, (_, i) => i + 1).map((week) => {
          const items = byWeek.get(week) ?? [];
          if (items.length === 0 && week !== currentWeek) return null;
          return (
            <div key={week} className="stack gap-4">
              <div className="row between">
                <Eyebrow>
                  Week {week}
                  {week === currentWeek ? " · this week" : ""}
                </Eyebrow>
              </div>
              {items.length === 0 ? (
                <Caption>No commitments this week yet.</Caption>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                  {items.map((c) => (
                    <li key={c.id}>
                      <CommitmentRow commitment={c} blockId={b.id} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommitmentRow({ commitment: c, blockId }: { commitment: Commitment; blockId: string }) {
  const isCarried = c.status === "carried";
  const canCarry = c.status !== "done" && c.status !== "carried" && c.week_number < BLOCK_WEEKS;

  return (
    <Card>
      <div className="row between" style={{ alignItems: "flex-start", gap: 12 }}>
        <Body style={{ margin: 0, textDecoration: c.status === "done" ? "line-through" : "none" }}>
          {c.text}
        </Body>
        <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
      </div>

      {c.carried_from && (
        <Caption style={{ marginTop: 6 }}>Carried forward from an earlier week.</Caption>
      )}
      {isCarried && (
        <Caption style={{ marginTop: 6 }}>
          Rolled forward — continued as a new commitment next week.
        </Caption>
      )}

      {!isCarried && (
        <div className="row gap-4" style={{ marginTop: 12, flexWrap: "wrap" }}>
          {(["done", "partial", "missed"] as CommitmentStatus[]).map((s) => (
            <form key={s} action={setCommitmentStatus}>
              <input type="hidden" name="commitment_id" value={c.id} />
              <input type="hidden" name="goal_block_id" value={blockId} />
              <input type="hidden" name="status" value={s} />
              <Button
                type="submit"
                size="sm"
                variant={c.status === s ? "primary" : "ghost"}
              >
                {s === "done" ? "Done" : s === "partial" ? "Partial" : "Missed"}
              </Button>
            </form>
          ))}
          {canCarry && (
            <form action={carryCommitment}>
              <input type="hidden" name="commitment_id" value={c.id} />
              <input type="hidden" name="goal_block_id" value={blockId} />
              <Button type="submit" size="sm" variant="secondary">
                Carry forward
              </Button>
            </form>
          )}
        </div>
      )}

      {!isCarried && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: "pointer", font: "500 12px/1 var(--font-sans)", color: "var(--fg-muted)" }}>
            Edit
          </summary>
          <form action={editCommitment} style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input type="hidden" name="commitment_id" value={c.id} />
            <input type="hidden" name="goal_block_id" value={blockId} />
            <input
              name="text"
              defaultValue={c.text}
              style={{ flex: 1 }}
              aria-label="Edit commitment text"
            />
            <Button type="submit" size="sm" variant="secondary">
              Save
            </Button>
          </form>
        </details>
      )}
    </Card>
  );
}
