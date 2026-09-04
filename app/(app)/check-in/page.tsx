import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireViewer, canSeeSociety } from "@/lib/session";
import { address, type CheckIn, type Profile } from "@/lib/domain";
import { memberSnapshot } from "@/lib/queries";
import { currentWeekKey, formatDayMonth, weekLabel } from "@/lib/weeks";
import { Avatar, Caption, Card, EmptyState, Eyebrow, H3, Notice, PageHeader, Section, Stat, TextLink } from "@/components/ui";
import { CheckInForm } from "@/components/check-in-form";

export const metadata: Metadata = { title: "Weekly check-in" };

export default async function CheckInPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { profile, repo, userId } = await requireViewer();
  if (!canSeeSociety(profile)) redirect("/upgrade");
  const { saved } = await searchParams;

  const weekKey = currentWeekKey();
  const [snap, circles] = await Promise.all([memberSnapshot(repo, profile), repo.listCirclesFor(userId)]);
  const pod = circles.find((c) => c.kind === "pod") ?? null;
  const existing = snap.checkIns.find((c) => c.weekKey === weekKey) ?? null;
  const history = snap.checkIns.filter((c) => c.weekKey !== weekKey).slice(0, 12);

  const podOthers = pod ? pod.members.filter((m) => m.userId !== userId) : [];
  const podCheckIns = pod
    ? (await repo.listCheckInsFor(podOthers.map((m) => m.userId), 100)).filter((c) => c.weekKey === weekKey)
    : [];
  const podProfile = new Map(podOthers.map((m) => [m.userId, m.profile]));

  return (
    <div className="section fade-enter">
      {saved && <Notice tone="ok">{existing ? "This week's check-in is on the record." : "Checked in."} Your circle can see it.</Notice>}
      <PageHeader
        eyebrow={weekLabel(weekKey)}
        title="Weekly check-in"
        lede="Four short questions, once a week. You never face a blank page, and your circle sees that you turned up."
      />

      <div className="grid-sidebar">
        <div className="stack gap-6">
          <Card emphasis={!existing}>
            <Eyebrow>{existing ? "Revise this week's check-in" : "This week's check-in"}</Eyebrow>
            {existing && (
              <Caption>Logged <time dateTime={existing.completedAt}>{formatDayMonth(existing.completedAt)}</time>. Saving again replaces it.</Caption>
            )}
            <CheckInForm circleId={pod?.id ?? null} defaultWeek={snap.week} existing={existing} />
          </Card>

          <Section title="Your history">
            {history.length === 0 ? (
              <EmptyState title="No earlier check-ins.">
                Your first is above. From next week this is where you look back.
              </EmptyState>
            ) : (
              <div className="feed">
                {history.map((c) => <HistoryItem key={c.id} c={c} />)}
              </div>
            )}
          </Section>
        </div>

        <div className="stack gap-6">
          <Card emphasis>
            <Eyebrow>Your standing</Eyebrow>
            <div className="stat-row">
              <Stat value={snap.streak} label="Week streak" sub={snap.checkedInThisWeek ? "this week counted" : "check in to extend"} />
              <Stat value={snap.score} label="Consistency" sub="of 100" tone="gold" />
            </div>
          </Card>

          <Card>
            <Eyebrow>This week in your circle</Eyebrow>
            {!pod ? (
              <>
                <H3>You are not in a pod yet.</H3>
                <Caption>When the House seats you, your pod&rsquo;s check-ins appear here each week.</Caption>
              </>
            ) : podCheckIns.length === 0 ? (
              <>
                <H3>Nobody has checked in yet.</H3>
                <Caption>{pod.name}. You could be first.</Caption>
              </>
            ) : (
              <>
                <Caption>{pod.name} · {podCheckIns.length} of {podOthers.length} checked in</Caption>
                <div className="feed">
                  {podCheckIns.map((c) => {
                    const p = podProfile.get(c.userId);
                    return p ? <CircleItem key={c.id} c={c} person={p} /> : null;
                  })}
                </div>
              </>
            )}
            <TextLink href="/circle">Your circle</TextLink>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CircleItem({ c, person }: { c: CheckIn; person: Profile }) {
  return (
    <div className="feed-item">
      <Avatar name={person.fullName} size="sm" />
      <div>
        <div className="feed-head">
          <span className="feed-who">{address(person)}</span>
          <time className="feed-when" dateTime={c.completedAt}>{weekLabel(c.weekKey)}</time>
        </div>
        <div className="feed-body">
          <dl>
            {c.didWell && <><dt>Went well</dt><dd>{c.didWell}</dd></>}
            {c.nextFocus && <><dt>Next</dt><dd>{c.nextFocus}</dd></>}
          </dl>
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ c }: { c: CheckIn }) {
  return (
    <div className="feed-item" style={{ gridTemplateColumns: "1fr" }}>
      <div>
        <div className="feed-head">
          <span className="feed-who">
            {weekLabel(c.weekKey)}
            {c.blockWeek ? ` · block week ${c.blockWeek}` : ""}
          </span>
          <time className="feed-when" dateTime={c.completedAt}>
            {formatDayMonth(c.completedAt)}{c.energy != null ? ` · energy ${c.energy} of 10` : ""}
          </time>
        </div>
        <div className="feed-body">
          <dl>
            {c.didWell && <><dt>Went well</dt><dd>{c.didWell}</dd></>}
            {c.struggledWith && <><dt>Struggled</dt><dd>{c.struggledWith}</dd></>}
            {c.nextFocus && <><dt>Next</dt><dd>{c.nextFocus}</dd></>}
          </dl>
        </div>
      </div>
    </div>
  );
}
