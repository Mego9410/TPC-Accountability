import Link from "next/link";
import type { Metadata } from "next";
import { requireUserProfile, surnameAddress, initials } from "@/lib/auth";
import { getActivePartnership, getGoals, getNextMeeting } from "@/lib/data";
import { Body, Button, Card, Caption, Divider, Eyebrow, H3 } from "@/components/ui";
import { Display } from "@/components/ui";
import { GoalList } from "@/components/goal-list";
import { CADENCE_LABEL, formatAppointment } from "@/lib/cadence";
import { isPreviewMode } from "@/lib/preview";

export const metadata: Metadata = { title: "The House" };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { userId, profile } = await requireUserProfile();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const preview = await isPreviewMode();
  const partnership = await getActivePartnership(userId);

  if (!partnership) {
    return (
      <div className="section fade-enter">
        <Eyebrow>The House · {today}</Eyebrow>
        <Display>{greeting()}, {surnameAddress(profile)}.</Display>
        <Body lg className="muted" style={{ maxWidth: 640 }}>
          You are in the queue. The Club is seeking a principal of fitting ambition
          and hour. You will be told the moment a match is made.
        </Body>
        <Divider />
        <Card emphasis style={{ maxWidth: 520 }}>
          <Eyebrow>While you wait</Eyebrow>
          <H3>Your particulars are lodged.</H3>
          <Caption>
            You may revise your focus and cadence at any time. A considered match is
            worth the wait.
          </Caption>
          <div className="row" style={{ marginTop: 8 }}>
            <Button href="/settings" variant="secondary" size="sm">
              Revise your particulars
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const partner = partnership.partner;
  const next = await getNextMeeting(partnership.id);
  const goals = await getGoals(partnership.id);
  const myOpen = goals.filter((g) => g.owner_id === userId && g.status === "open");
  const partnerOpen = goals.filter((g) => g.owner_id === partner.id && g.status === "open");

  return (
    <div className="section fade-enter">
      <Eyebrow>The House · {today}</Eyebrow>
      <Display>
        {greeting()}, {surnameAddress(profile)}.
      </Display>
      <Body lg className="muted" style={{ maxWidth: 640 }}>
        {next
          ? `Your next sitting with ${surnameAddress(partner)} is held for ${formatAppointment(
              next.scheduled_at,
            )}.`
          : `You are paired with ${surnameAddress(partner)}. No sitting is presently held.`}
      </Body>

      <Divider />

      <div className="grid-2">
        <div className="stack gap-6">
          {next ? (
            <Card emphasis>
              <Eyebrow>Your next sitting</Eyebrow>
              <H3>{formatAppointment(next.scheduled_at)}</H3>
              <Caption>
                {CADENCE_LABEL[next.cadence]} cadence · with {surnameAddress(partner)}
              </Caption>
              <div className="row gap-4" style={{ marginTop: 8 }}>
                <Button href={`/meetings/${next.id}`}>Enter the room</Button>
                <Button href="/calendar" variant="ghost">
                  View the calendar
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <Eyebrow>No sitting held</Eyebrow>
              <H3>Arrange your next appointment.</H3>
              <Caption>Set a standing time with your partner.</Caption>
              <div className="row" style={{ marginTop: 8 }}>
                <Button href="/calendar" variant="secondary" size="sm">
                  Arrange a sitting
                </Button>
              </div>
            </Card>
          )}

          <div className="stack gap-4">
            <div className="row between">
              <Eyebrow>Your open goals</Eyebrow>
              <Link
                href="/goals"
                style={{
                  font: "500 10px/1 var(--font-sans)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--tpc-gold-deep)",
                  textDecoration: "none",
                }}
              >
                The ledger
              </Link>
            </div>
            <GoalList goals={myOpen} canEdit demo={preview} />
          </div>
        </div>

        <div className="stack gap-6">
          <Card>
            <Eyebrow>Your partner</Eyebrow>
            <div className="partner-card">
              <div className="pc-avatar">{initials(partner.full_name)}</div>
              <div>
                <H3>{surnameAddress(partner)}</H3>
                <Caption>
                  {partner.practice_name ?? "Principal dentist"}
                  {partner.location ? ` · ${partner.location}` : ""}
                </Caption>
              </div>
            </div>
            {partner.bio && (
              <Body style={{ fontFamily: "var(--font-serif)", fontSize: 16 }}>
                <i>{partner.bio}</i>
              </Body>
            )}
            <div className="row gap-4" style={{ marginTop: 4 }}>
              <Button href="/messages" variant="secondary" size="sm">
                Send a note
              </Button>
            </div>
          </Card>

          <div className="stack gap-4">
            <Eyebrow>What {partner.full_name ? surnameAddress(partner) : "your partner"} is working on</Eyebrow>
            <GoalList goals={partnerOpen} canEdit={false} />
          </div>

          <Card emphasis>
            <Eyebrow>Your standing</Eyebrow>
            <H3>No. {profile.membership_no ?? "————"} · Principal</H3>
            <Caption>
              {CADENCE_LABEL[partnership.cadence]} cadence. Paired since{" "}
              {new Date(partnership.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </Caption>
          </Card>
        </div>
      </div>
    </div>
  );
}
