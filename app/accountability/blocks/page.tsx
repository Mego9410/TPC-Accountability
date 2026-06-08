import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { requireUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Body, Badge, Card, Caption, Divider, Eyebrow, H1, H3 } from "@/components/ui";
import { CreateBlockForm } from "@/components/accountability/create-block-form";
import { BLOCK_WEEKS, clampWeek, currentBlockWeek } from "@/lib/accountability";
import type { GoalBlock } from "@/lib/types";

export const metadata: Metadata = { title: "Goal blocks" };

const STATUS_VARIANT: Record<string, string> = {
  active: "gold",
  completed: "",
  abandoned: "",
};

export default async function BlocksPage() {
  await requireUserProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("goal_blocks")
    .select("*")
    .order("created_at", { ascending: false });
  const blocks = (data ?? []) as GoalBlock[];

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="section fade-enter">
      <Eyebrow>Twelve-week blocks</Eyebrow>
      <H1>Your goal blocks.</H1>
      <Body className="muted" style={{ maxWidth: 620 }}>
        A block is a twelve-week stretch with one outcome. Lay out weekly
        commitments beneath it and keep them.
      </Body>

      <Divider />

      <div className="grid-2">
        <div className="stack gap-4">
          <Eyebrow>Your blocks</Eyebrow>
          {blocks.length === 0 ? (
            <Card>
              <H3>No blocks yet.</H3>
              <Caption>Begin your first twelve-week block to the right.</Caption>
            </Card>
          ) : (
            <div className="stack gap-4">
              {blocks.map((b) => {
                const week = clampWeek(currentBlockWeek(b));
                return (
                  <Link
                    key={b.id}
                    href={`/accountability/blocks/${b.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Card>
                      <div className="row between" style={{ alignItems: "flex-start" }}>
                        <H3>{b.title}</H3>
                        <Badge variant={STATUS_VARIANT[b.status] ?? ""}>{b.status}</Badge>
                      </div>
                      <Caption>
                        {format(new Date(`${b.start_date}T00:00:00`), "d MMM yyyy")} —{" "}
                        {format(new Date(`${b.end_date}T00:00:00`), "d MMM yyyy")}
                        {b.status === "active" ? ` · week ${week} of ${BLOCK_WEEKS}` : ""}
                      </Caption>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <Card emphasis>
          <Eyebrow>Begin a block</Eyebrow>
          <H3>A new twelve-week block.</H3>
          <div style={{ marginTop: 16 }}>
            <CreateBlockForm defaultStart={today} />
          </div>
        </Card>
      </div>
    </div>
  );
}
