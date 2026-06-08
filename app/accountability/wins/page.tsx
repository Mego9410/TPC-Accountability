import type { Metadata } from "next";
import { format } from "date-fns";
import { requireUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Body, Button, Card, Caption, Divider, Eyebrow, H1, H3 } from "@/components/ui";
import { LogWinForm } from "@/components/accountability/log-win-form";
import { archiveWin, restoreWin } from "@/lib/actions/accountability";
import type { GoalBlock, Win } from "@/lib/types";

export const metadata: Metadata = { title: "Win log" };

export default async function WinsPage() {
  await requireUserProfile();
  const supabase = await createClient();

  const { data: winRows } = await supabase
    .from("wins")
    .select("*")
    .order("created_at", { ascending: false });
  const wins = (winRows ?? []) as Win[];
  const active = wins.filter((w) => !w.archived_at);
  const archived = wins.filter((w) => w.archived_at);

  const { data: blockRows } = await supabase
    .from("goal_blocks")
    .select("id, title")
    .order("created_at", { ascending: false });
  const blocks = (blockRows ?? []) as Pick<GoalBlock, "id" | "title">[];

  return (
    <div className="section fade-enter">
      <Eyebrow>The permanent record</Eyebrow>
      <H1>Your win log.</H1>
      <Body className="muted" style={{ maxWidth: 620 }}>
        Every win you log stays on your record. This is the history you build —
        it is never deleted, only archived if you wish to tidy the view.
      </Body>

      <Divider />

      <div className="grid-2">
        <Card emphasis>
          <Eyebrow>Log a win</Eyebrow>
          <div style={{ marginTop: 12 }}>
            <LogWinForm blocks={blocks} />
          </div>
        </Card>

        <div className="stack gap-4">
          <Eyebrow>{active.length} {active.length === 1 ? "win" : "wins"}</Eyebrow>
          {active.length === 0 ? (
            <Card>
              <Caption>No wins logged yet. The first one is always the smallest.</Caption>
            </Card>
          ) : (
            active.map((w) => (
              <Card key={w.id}>
                <div className="row between" style={{ alignItems: "flex-start" }}>
                  <H3>{w.title}</H3>
                  <Caption>{format(new Date(w.created_at), "d MMM yyyy")}</Caption>
                </div>
                {w.detail && <Body style={{ marginTop: 6 }}>{w.detail}</Body>}
                <details style={{ marginTop: 10 }}>
                  <summary
                    style={{
                      cursor: "pointer",
                      font: "500 12px/1 var(--font-sans)",
                      color: "var(--fg-muted)",
                    }}
                  >
                    Archive this win
                  </summary>
                  <form action={archiveWin} style={{ marginTop: 8 }}>
                    <input type="hidden" name="win_id" value={w.id} />
                    <Caption style={{ marginBottom: 8 }}>
                      Archiving hides it from this list. It is never deleted.
                    </Caption>
                    <Button type="submit" size="sm" variant="ghost">
                      Confirm archive
                    </Button>
                  </form>
                </details>
              </Card>
            ))
          )}

          {archived.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary
                style={{
                  cursor: "pointer",
                  font: "500 11px/1 var(--font-sans)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--fg-muted)",
                }}
              >
                {archived.length} archived
              </summary>
              <div className="stack gap-4" style={{ marginTop: 12 }}>
                {archived.map((w) => (
                  <Card key={w.id}>
                    <div className="row between" style={{ alignItems: "flex-start" }}>
                      <H3 style={{ color: "var(--fg-muted)" }}>{w.title}</H3>
                      <Caption>{format(new Date(w.created_at), "d MMM yyyy")}</Caption>
                    </div>
                    <form action={restoreWin} style={{ marginTop: 8 }}>
                      <input type="hidden" name="win_id" value={w.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Restore
                      </Button>
                    </form>
                  </Card>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
