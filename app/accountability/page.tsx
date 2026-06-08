import type { Metadata } from "next";
import { requireUserProfile, surnameAddress } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Body, Button, Card, Caption, Divider, Eyebrow, Display, H3 } from "@/components/ui";
import {
  BLOCK_WEEKS,
  checkInStreak,
  clampWeek,
  currentBlockWeek,
  currentWeekKey,
  isoWeekKey,
} from "@/lib/accountability";
import type { CheckIn, GoalBlock } from "@/lib/types";

export const metadata: Metadata = { title: "Accountability" };

export default async function AccountabilityHome() {
  const { profile } = await requireUserProfile();
  const needsSetup = !profile.region || !profile.practice_type;
  const supabase = await createClient();

  const { data: activeBlock } = await supabase
    .from("goal_blocks")
    .select("*")
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const block = (activeBlock ?? null) as GoalBlock | null;

  const { data: checkInRows } = await supabase
    .from("check_ins")
    .select("completed_at")
    .order("completed_at", { ascending: false })
    .limit(60);
  const checkIns = (checkInRows ?? []) as Pick<CheckIn, "completed_at">[];

  const { data: membership } = await supabase
    .from("pod_members")
    .select("pod_id")
    .eq("user_id", profile.id)
    .is("left_at", null)
    .limit(1)
    .maybeSingle();
  const inPod = Boolean(membership?.pod_id);

  const streak = checkInStreak(checkIns);
  const checkedInThisWeek = checkIns.some(
    (c) => isoWeekKey(new Date(c.completed_at)) === currentWeekKey(),
  );
  const week = block ? clampWeek(currentBlockWeek(block)) : null;

  return (
    <div className="section fade-enter">
      <Eyebrow>The accountability society</Eyebrow>
      <Display>Welcome, {surnameAddress(profile)}.</Display>
      <Body lg className="muted" style={{ maxWidth: 640 }}>
        Your goal blocks, weekly check-ins, win log and benchmarking, all in one
        place.
      </Body>

      <Divider />

      <div className="grid-2">
        <div className="stack gap-6">
          <Card emphasis>
            <Eyebrow>Your standing</Eyebrow>
            <div className="row gap-6" style={{ alignItems: "baseline", marginTop: 4 }}>
              <div>
                <Display style={{ fontSize: 44 }}>{Math.round(profile.reliability_score)}</Display>
                <Caption>Consistency score</Caption>
              </div>
              <div>
                <Display style={{ fontSize: 44 }}>{streak}</Display>
                <Caption>{streak === 1 ? "week streak" : "week streak"}</Caption>
              </div>
            </div>
          </Card>

          {block ? (
            <Card>
              <Eyebrow>Your active block · week {week} of {BLOCK_WEEKS}</Eyebrow>
              <H3>{block.title}</H3>
              <div className="row gap-4" style={{ marginTop: 12 }}>
                <Button href={`/accountability/blocks/${block.id}`} size="sm">
                  Open the block
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <Eyebrow>No active block</Eyebrow>
              <H3>Begin a twelve-week block.</H3>
              <Caption>Set one outcome and lay out weekly commitments beneath it.</Caption>
              <div className="row" style={{ marginTop: 12 }}>
                <Button href="/accountability/blocks" size="sm">
                  Create a block
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="stack gap-6">
          <Card>
            <Eyebrow>This week</Eyebrow>
            <H3>{checkedInThisWeek ? "Check-in complete." : "Your check-in is waiting."}</H3>
            <Caption>
              {checkedInThisWeek
                ? "You've logged this week's reflection. Keep the streak going next week."
                : "A short, structured reflection. You never face a blank page."}
            </Caption>
            <div className="row gap-4" style={{ marginTop: 12 }}>
              <Button href="/accountability/check-in" size="sm" variant={checkedInThisWeek ? "secondary" : "primary"}>
                {checkedInThisWeek ? "Revisit this week" : "Check in now"}
              </Button>
              <Button href="/accountability/wins" size="sm" variant="ghost">
                Log a win
              </Button>
            </div>
          </Card>

          <Card>
            <Eyebrow>Your pod</Eyebrow>
            <H3>{inPod ? "Your pod is waiting." : "No pod yet."}</H3>
            <Caption>
              {inPod
                ? "See your podmates and what they committed to this week."
                : "The Club will place you in a pod of four to six principals."}
            </Caption>
            {inPod && (
              <div className="row" style={{ marginTop: 12 }}>
                <Button href="/accountability/pod" size="sm" variant="secondary">
                  Open your pod
                </Button>
              </div>
            )}
          </Card>

          {needsSetup && (
            <Card emphasis>
              <Eyebrow>First, your particulars</Eyebrow>
              <H3>Complete your practice profile.</H3>
              <Caption>Your region and practice type place you in the right benchmarking cohort.</Caption>
              <div className="row" style={{ marginTop: 12 }}>
                <Button href="/accountability/profile" size="sm">
                  Set up your profile
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
