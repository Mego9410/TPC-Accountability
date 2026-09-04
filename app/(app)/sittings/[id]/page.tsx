import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/session";
import { CIRCLE_ROLE_LABEL, SITTING_KIND_LABEL, address, isMentorIn, type CircleWithMembers } from "@/lib/domain";
import type { Repo } from "@/lib/repo/types";
import { circleTitle, memberSnapshot } from "@/lib/queries";
import { currentWeekKey, formatAppointment, formatShortDate, relativeDays, weekLabel } from "@/lib/weeks";
import { Body, Button, Caption, Card, CommitmentBadge, EmptyState, Eyebrow, HairlineList, HairlineRow, PageHeader, Person, RoleBadge, Section, SittingBadge, SittingKindBadge, TextLink } from "@/components/ui";
import { Form, QuickAction, SubmitButton, FField as Field, FTextArea as TextArea } from "@/components/ui/form";
import { updateSitting } from "@/lib/actions/sittings";

export const metadata: Metadata = { title: "Sitting" };

/**
 * The shape of a companion practice visit. A suggestion, not a timetable: the
 * visitor sets the agenda, within whatever the host is willing to show.
 */
const PROGRAMME: Array<{ at: string; what: string }> = [
  { at: "8.15", what: "Arrive, coffee, and what the host wants a second pair of eyes on" },
  { at: "8.30", what: "The morning huddle, standing at the back" },
  { at: "9.00", what: "The surgeries: how the day is set up and who does what" },
  { at: "10.30", what: "The diary, chair by chair, six weeks out" },
  { at: "11.30", what: "Reception: the phone, the recall list, the first conversation a patient has" },
  { at: "12.30", what: "Lunch, and three things each of you will take home" },
];

export default async function SittingPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile, repo, userId } = await requireViewer();
  const { id } = await params;
  const sitting = await repo.getSitting(id);
  if (!sitting) notFound();
  const circles = await repo.listCirclesFor(userId);
  const circle = circles.find((c) => c.id === sitting.circleId);
  if (!circle) notFound();

  const others = circle.members.filter((m) => m.userId !== userId);
  const scheduled = sitting.status === "scheduled";
  const isVisit = sitting.kind === "visit";
  const host = isVisit ? circle.members.find((m) => m.userId === sitting.hostId) ?? null : null;
  const hosting = isVisit && sitting.hostId === userId;
  const withWhom =
    circle.kind === "pair"
      ? others[0]
        ? `With ${address(others[0].profile)}, your ${CIRCLE_ROLE_LABEL[others[0].role].toLowerCase()}.`
        : "Your partner has not yet taken their seat."
      : `${circle.members.length} principals of ${circle.name}.`;
  const lede = isVisit
    ? hosting
      ? `The circle comes to you. ${withWhom}`
      : host
        ? `A morning inside ${address(host.profile)}'s practice. ${withWhom}`
        : `A morning inside a member's practice. ${withWhom}`
    : withWhom;

  const previous = (await repo.listSittings([circle.id]))
    .filter((s) => s.id !== sitting.id && s.scheduledAt < sitting.scheduledAt)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  // Whose week goes on the table: in a pair, everyone the viewer may see; in a pod, only the viewer.
  const prepFor =
    circle.kind === "pair"
      ? isMentorIn(circle, userId)
        ? circle.members
        : circle.members.filter((m) => m.userId === userId)
      : circle.members.filter((m) => m.userId === userId);

  return (
    <div className="section fade-enter">
      <TextLink href="/calendar" back>The diary</TextLink>
      <PageHeader
        eyebrow={
          <span className="row gap-3">
            {isVisit && <>{SITTING_KIND_LABEL.visit} ·</>}
            <SittingBadge status={sitting.status} /> {circleTitle(circle, userId)}
          </span>
        }
        title={<time dateTime={sitting.scheduledAt}>{formatAppointment(sitting.scheduledAt)}</time>}
        lede={`${lede} ${scheduled ? capitalise(relativeDays(sitting.scheduledAt)) + "." : ""}`}
        actions={
          scheduled && !isVisit && sitting.joinUrl ? <Button href={sitting.joinUrl} external>Join</Button> : undefined
        }
      />

      {isVisit && (
        <Card emphasis={scheduled}>
          <Eyebrow>{hosting ? "You are the host" : "The practice"}</Eyebrow>
          {host ? (
            <Person
              name={hosting ? `${host.profile.fullName} (you)` : host.profile.fullName}
              size="lg"
              meta={sitting.location ?? host.profile.practiceName ?? "Principal"}
              trailing={<RoleBadge role={host.role} />}
            />
          ) : (
            <Person name={sitting.location ?? "A practice"} size="lg" meta="The host has left this circle." />
          )}
          <Caption>
            {[host?.profile.region, host?.profile.practiceType, host?.profile.chairCount ? `${host.profile.chairCount} chairs` : null]
              .filter(Boolean)
              .join(" · ") || "A morning in the practice, not a meeting room."}
          </Caption>
        </Card>
      )}

      <div className="row gap-5 wrap">
        {circle.members.map((m) => (
          <Person key={m.userId} name={m.userId === userId ? `${m.profile.fullName} (you)` : m.profile.fullName} size="sm" meta={CIRCLE_ROLE_LABEL[m.role]} />
        ))}
      </div>

      {isVisit ? (
        <Section title="The morning" aside={<Caption>A suggested shape</Caption>}>
          <Card>
            <ol className="programme">
              {PROGRAMME.map((item) => (
                <li key={item.at}>
                  <span className="at">{item.at}</span>
                  <span className="what">{item.what}</span>
                </li>
              ))}
            </ol>
            <Caption>The visitor sets the agenda, within whatever the host is willing to show.</Caption>
          </Card>
        </Section>
      ) : (
        <Section title="Prepare" aside={<Caption>{weekLabel(currentWeekKey())}</Caption>}>
          <div className="card-grid">
            {prepFor.map((m) => (
              <PrepareCard key={m.userId} circle={circle} userId={m.userId} viewerId={userId} repo={repo} />
            ))}
          </div>
          {circle.kind === "pod" && (
            <Caption>Each principal brings their own week to a pod sitting. {isMentorIn(circle, userId) ? "As lead, you can see everyone's check-ins on the circle page." : ""}</Caption>
          )}
        </Section>
      )}

      <Section title="Notes from the sitting">
        {!scheduled && sitting.notes && (
          <Card>
            <Eyebrow>As recorded</Eyebrow>
            <Body>{sitting.notes}</Body>
          </Card>
        )}
        {!scheduled && !sitting.notes && sitting.status === "completed" && (
          <Caption>This sitting was held but no notes were kept. You can still add them below.</Caption>
        )}
        <Card>
          <Form action={updateSitting}>
            <>
              <input type="hidden" name="sitting_id" value={sitting.id} />
              <TextArea
                label="Notes"
                name="notes"
                rows={6}
                defaultValue={sitting.notes ?? ""}
                placeholder="What was agreed, what carries, what to bring next time."
              />
              <Field
                label="Meeting link"
                name="join_url"
                type="url"
                inputMode="url"
                defaultValue={sitting.joinUrl ?? ""}
                placeholder="https://"
                help="Google Meet, Teams or Zoom link. Optional."
              />
              <div className="form-actions">
                <SubmitButton>Save notes</SubmitButton>
              </div>
            </>
          </Form>
          {scheduled && (
            <div className="row gap-3 wrap">
              <QuickAction action={updateSitting} fields={{ sitting_id: sitting.id, status: "completed" }} variant="secondary" pendingText="Recording…">
                Mark as held
              </QuickAction>
              <QuickAction
                action={updateSitting}
                fields={{ sitting_id: sitting.id, status: "cancelled" }}
                confirm="Cancel this sitting? Everyone in the circle will see it struck from the diary."
                pendingText="Cancelling…"
              >
                Cancel
              </QuickAction>
            </div>
          )}
        </Card>
      </Section>

      <Section title="Previous sittings in this circle">
        {previous.length === 0 ? (
          <EmptyState title="This is the first.">Earlier sittings in this circle will be listed here.</EmptyState>
        ) : (
          <HairlineList>
            {previous.map((s) => (
              <HairlineRow
                key={s.id}
                href={`/sittings/${s.id}`}
                date={<time dateTime={s.scheduledAt}>{formatShortDate(s.scheduledAt)}</time>}
                title={formatAppointment(s.scheduledAt)}
                meta={[s.kind === "visit" ? s.location : null, s.notes ? excerpt(s.notes, 140) : "No notes were kept."].filter(Boolean).join(" · ")}
                right={
                  <span className="badge-row">
                    <SittingKindBadge kind={s.kind} />
                    <SittingBadge status={s.status} />
                  </span>
                }
              />
            ))}
          </HairlineList>
        )}
      </Section>
      {profile.role === "staff" && <Caption>You are viewing this sitting as the House.</Caption>}
    </div>
  );
}

/* ---------- One member's week on the table ---------- */

async function PrepareCard({ circle, userId, viewerId, repo }: { circle: CircleWithMembers; userId: string; viewerId: string; repo: Repo }) {
  const member = circle.members.find((m) => m.userId === userId);
  if (!member) return null;
  const snap = await memberSnapshot(repo, member.profile);
  const open = snap.thisWeek.filter((c) => c.status !== "carried");
  const latest = snap.latestCheckIn;
  const you = userId === viewerId;
  return (
    <Card pad="sm">
      <Person name={member.profile.fullName} size="sm" meta={snap.block ? `Week ${snap.week} · ${snap.block.title}` : "No block running"} trailing={<RoleBadge role={member.role} />} />
      <div>
        <Eyebrow>This week</Eyebrow>
        {open.length === 0 ? (
          <Caption>
            {snap.block ? "Nothing set down for this week." : you ? "Start a block to bring commitments to a sitting." : "No commitments to bring."}
            {you && snap.block && <> <TextLink href={`/blocks/${snap.block.id}#add`}>Set one</TextLink></>}
          </Caption>
        ) : (
          <div className="prep-list">
            {open.map((c) => (
              <div key={c.id} className={`commitment ${c.status}`}>
                <div className="cm-week">Wk {c.week}</div>
                <div>
                  <div className="cm-text">{c.text}</div>
                  {c.carriedFrom && <div className="cm-meta">Carried from an earlier week.</div>}
                </div>
                <div className="cm-actions"><CommitmentBadge status={c.status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <Eyebrow>Latest check-in</Eyebrow>
        {latest ? (
          <div className="feed-body">
            <Caption>{weekLabel(latest.weekKey)}{latest.energy != null ? ` · energy ${latest.energy} of 10` : ""}</Caption>
            <dl>
              {latest.didWell && (<><dt>Went well</dt><dd>{latest.didWell}</dd></>)}
              {latest.struggledWith && (<><dt>Struggled</dt><dd>{latest.struggledWith}</dd></>)}
            </dl>
          </div>
        ) : (
          <Caption>{you ? "You have not checked in yet." : "No check-in yet."}{you && <> <TextLink href="/check-in">Check in</TextLink></>}</Caption>
        )}
      </div>
    </Card>
  );
}

/* ---------- Helpers ---------- */

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function excerpt(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}
