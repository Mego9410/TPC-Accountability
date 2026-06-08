import type { Metadata } from "next";
import { requireUserProfile, surnameAddress } from "@/lib/auth";
import { getActivePartnership, getGoals } from "@/lib/data";
import { Body, Caption, Divider, Eyebrow, H1, H3 } from "@/components/ui";
import { GoalList } from "@/components/goal-list";
import { AddGoalForm } from "@/components/add-goal-form";
import { isPreviewMode } from "@/lib/preview";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  const { userId } = await requireUserProfile();
  const preview = await isPreviewMode();
  const partnership = await getActivePartnership(userId);

  if (!partnership) {
    return (
      <div className="section fade-enter">
        <Eyebrow>The ledger</Eyebrow>
        <H1>Goals.</H1>
        <div className="notice" style={{ maxWidth: 560 }}>
          The ledger opens once you are matched. Your goals are kept here, beside
          your partner&apos;s, sitting after sitting.
        </div>
      </div>
    );
  }

  const partner = partnership.partner;
  const goals = await getGoals(partnership.id);
  const mine = goals.filter((g) => g.owner_id === userId);
  const myOpen = mine.filter((g) => g.status === "open");
  const myDone = mine.filter((g) => g.status === "done");
  const theirs = goals.filter((g) => g.owner_id === partner.id);

  return (
    <div className="section fade-enter">
      <Eyebrow>The ledger</Eyebrow>
      <H1>Goals.</H1>
      <Body className="muted" style={{ maxWidth: 640 }}>
        What you have said you will do. A goal kept is struck through; a goal
        outstanding remains until the next sitting.
      </Body>

      <Divider />

      <div className="grid-2">
        <div className="stack gap-6">
          <AddGoalForm partnershipId={partnership.id} demo={preview} />

          <div className="stack gap-4">
            <Eyebrow>Outstanding</Eyebrow>
            <GoalList goals={myOpen} canEdit showDelete demo={preview} />
          </div>

          {myDone.length > 0 && (
            <div className="stack gap-4">
              <Eyebrow>Kept</Eyebrow>
              <GoalList goals={myDone} canEdit showDelete demo={preview} />
            </div>
          )}
        </div>

        <div className="stack gap-4">
          <Eyebrow>{surnameAddress(partner)}</Eyebrow>
          <H3 style={{ fontSize: 20 }}>What your partner is working on</H3>
          <Caption>You may see your partner&apos;s ledger, but only they may strike it through.</Caption>
          <div style={{ marginTop: 8 }}>
            <GoalList goals={theirs} canEdit={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
