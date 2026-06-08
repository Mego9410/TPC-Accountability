import type { Metadata } from "next";
import { format } from "date-fns";
import { requireUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Body, Card, Caption, Divider, Eyebrow, H1, H3 } from "@/components/ui";
import { CheckInForm } from "@/components/accountability/check-in-form";
import { clampWeek, currentBlockWeek } from "@/lib/accountability";
import type { CheckIn, GoalBlock } from "@/lib/types";

export const metadata: Metadata = { title: "Weekly check-in" };

export default async function CheckInPage() {
  await requireUserProfile();
  const supabase = await createClient();

  const { data: activeBlock } = await supabase
    .from("goal_blocks")
    .select("*")
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const defaultWeek = activeBlock
    ? clampWeek(currentBlockWeek(activeBlock as GoalBlock))
    : null;

  const { data: history } = await supabase
    .from("check_ins")
    .select("*")
    .order("completed_at", { ascending: false })
    .limit(12);
  const checkIns = (history ?? []) as CheckIn[];

  return (
    <div className="section fade-enter">
      <Eyebrow>Your weekly sitting with yourself</Eyebrow>
      <H1>This week&rsquo;s check-in.</H1>
      <Body className="muted" style={{ maxWidth: 620 }}>
        A short, structured reflection. You never face a blank page — answer what
        you can and log it.
      </Body>

      <Divider />

      <div className="grid-2">
        <Card emphasis>
          <Eyebrow>The agenda</Eyebrow>
          <div style={{ marginTop: 12 }}>
            <CheckInForm defaultWeek={defaultWeek} />
          </div>
        </Card>

        <div className="stack gap-4">
          <Eyebrow>Your check-in history</Eyebrow>
          {checkIns.length === 0 ? (
            <Card>
              <Caption>No check-ins yet. Your first one starts the record.</Caption>
            </Card>
          ) : (
            checkIns.map((c) => (
              <Card key={c.id}>
                <div className="row between">
                  <H3>{format(new Date(c.completed_at), "d MMM yyyy")}</H3>
                  <Caption>
                    {c.week_number ? `Week ${c.week_number}` : ""}
                    {c.energy_score ? ` · energy ${c.energy_score}/10` : ""}
                  </Caption>
                </div>
                {c.did_well && (
                  <Caption style={{ marginTop: 6 }}>
                    <strong>Went well:</strong> {c.did_well}
                  </Caption>
                )}
                {c.struggled_with && (
                  <Caption style={{ marginTop: 4 }}>
                    <strong>Struggled:</strong> {c.struggled_with}
                  </Caption>
                )}
                {c.next_week_focus && (
                  <Caption style={{ marginTop: 4 }}>
                    <strong>Focus:</strong> {c.next_week_focus}
                  </Caption>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
