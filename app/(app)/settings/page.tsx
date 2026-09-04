import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { MEMBER_ROLE_LABEL, TIER_LABEL } from "@/lib/domain";
import { changeTier } from "@/lib/actions/profile";
import { formatLongDate } from "@/lib/weeks";
import { Button, Caption, Card, Eyebrow, H3, PageHeader } from "@/components/ui";
import { QuickAction } from "@/components/ui/form";
import { ParticularsForm } from "@/components/particulars-form";

export const metadata: Metadata = { title: "Your particulars" };

export default async function SettingsPage() {
  const { profile } = await requireViewer();

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Settings"
        title="Your particulars."
        lede="Who you are, what you run, and how you would like the Club to reach you. The House reads these when it seats you."
      />

      <div className="grid-sidebar">
        <ParticularsForm profile={profile} />

        <div className="stack gap-6">
          <Card>
            <Eyebrow>Membership</Eyebrow>
            <dl className="kv-list">
              <div className="kv-row"><dt>Standing</dt><dd>{TIER_LABEL[profile.tier]}</dd></div>
              <div className="kv-row"><dt>Role</dt><dd>{MEMBER_ROLE_LABEL[profile.role]}</dd></div>
              <div className="kv-row"><dt>Number</dt><dd>No. {profile.membershipNo}</dd></div>
              <div className="kv-row">
                <dt>Joined</dt>
                <dd><time dateTime={profile.createdAt}>{formatLongDate(profile.createdAt)}</time></dd>
              </div>
            </dl>
            {profile.tier === "member" ? (
              <>
                <Caption>The Society adds twelve-week blocks, the weekly check-in, the win log and the benchmark.</Caption>
                <div className="row" style={{ marginTop: 4 }}>
                  <Button href="/upgrade" size="sm">Join the Society</Button>
                </div>
              </>
            ) : (
              <>
                <Caption>Society member</Caption>
                <details className="disclosure">
                  <summary>Leave the Society</summary>
                  <div className="disclosure-body">
                    <Caption>
                      You keep your circle, your sittings and your correspondence. Your blocks, check-ins, wins and figures are kept by the House and shown again if you return.
                    </Caption>
                    <div className="row">
                      <QuickAction
                        action={changeTier}
                        fields={{ tier: "member" }}
                        variant="secondary"
                        confirm="Leave the Society? Your record is kept, but the blocks, check-in, wins and benchmark are closed to you until you rejoin."
                      >
                        Leave the Society
                      </QuickAction>
                    </div>
                  </div>
                </details>
              </>
            )}
          </Card>

          <Card>
            <Eyebrow>Sign out</Eyebrow>
            <H3>Leave for now.</H3>
            <Caption>You will be asked for your details again when you return.</Caption>
            <div className="row" style={{ marginTop: 4 }}>
              <a href="/auth/signout" className="btn secondary sm">Sign out</a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
