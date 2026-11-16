import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import {
  VISITS_A_YEAR,
  address,
  awaitingAnswerFrom,
  firstName,
  initials,
  otherPartyOfVisit,
  partnerIdOf,
  practiceLine,
  visitsThisYear,
  type Goal,
  type GoalUpdate,
  type Profile,
  type Visit,
} from "@/lib/domain";
import { answerPartnerRequest } from "@/lib/actions/partners";
import { answerVisit } from "@/lib/actions/visits";
import { formatAppointment, relativeDays } from "@/lib/weeks";
import { PHOTO } from "@/components/landing/photos";
import {
  Body, Button, Caption, Card, EmptyState, H3, Person, Section, TextLink, VisitBadge,
} from "@/components/ui";
import { QuickAction } from "@/components/ui/form";
import { LatestUpdate, loadGoals, loadPartnerships, namer } from "../parts";
import { WhoseList } from "./whose-list";

export const metadata: Metadata = { title: "The Ledger" };

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const TODAY = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

/* =========================================================================
   The Ledger.

   Where everything stands, on one page: anything waiting on an answer, your
   partner, the two lists, and this year's two mornings. The dark card and
   the photographed morning panels come straight from the design; the data
   behind them is the real thing, so an empty Club shows as empty rather
   than as a demonstration.
   ------------------------------------------------------------------------- */

export default async function LedgerPage() {
  const { repo, userId, profile } = await requireViewer();

  const [{ active, incoming, people }, visits] = await Promise.all([
    loadPartnerships(repo, userId),
    repo.listVisitsFor(userId),
  ]);
  const partner = active ? people.get(partnerIdOf(active, userId)) ?? null : null;

  const visitsWaiting = visits.filter((v) => awaitingAnswerFrom(v, userId));
  const others = [...new Set(visitsWaiting.map((v) => otherPartyOfVisit(v, userId)))];
  const visitPeople = new Map<string, Profile>((await repo.listProfiles(others)).map((p) => [p.id, p]));

  const { goals, updatesFor } = await loadGoals(repo, partner ? [userId, partner.id] : [userId]);
  const myOpen = goals.filter((g) => g.userId === userId && g.status === "open");
  const theirOpen = partner ? goals.filter((g) => g.userId === partner.id && g.status === "open") : [];

  const now = Date.now();
  const agreed = visits.filter((v) => v.status === "agreed").sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const nextVisit = agreed.find((v) => new Date(v.scheduledAt).getTime() >= now) ?? agreed[0] ?? null;
  const nextVisitOther = nextVisit
    ? (await repo.listProfiles([otherPartyOfVisit(nextVisit, userId)]))[0] ?? null
    : null;
  const held = visits
    .filter((v) => v.status === "held")
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  const used = visitsThisYear(visits, userId);

  const nameOf = namer(new Map([...people, ...visitPeople]), userId);
  const waiting = incoming.length + visitsWaiting.length;
  const written = partner
    ? goals.filter((g) => g.userId === userId).flatMap((g) => updatesFor(g.id)).filter((u) => u.authorId === partner.id).length
    : 0;

  return (
    <div className="section fade-enter">
      {/* ---------- The greeting ---------- */}
      <header className="lg-head">
        <div>
          <p className="eyebrow">{TODAY.format(new Date())}</p>
          <h1 className="lg-hello">{greeting(new Date())}, {firstName(profile)}.</h1>
          <p className="lg-hello-sub">
            {waiting > 0
              ? `${waiting === 1 ? "One thing is" : `${waiting} things are`} waiting on you.`
              : partner && written > 0
                ? `${address(partner)} has written against ${written === 1 ? "one of your lines" : `${written} of your lines`}.`
                : "Nothing is waiting on you. Here is where everything stands."}
          </p>
        </div>
        <Button href="/members" variant="secondary" size="sm">Members directory</Button>
      </header>

      {/* ---------- Anything that needs an answer ---------- */}
      {waiting > 0 && (
        <Section title="Waiting on you">
          <div className="stack gap-5">
            {incoming.map((p) => {
              const them = people.get(partnerIdOf(p, userId));
              return (
                <Card key={p.id} emphasis>
                  <Person name={them?.fullName ?? "A principal"} size="lg" meta={them ? practiceLine(them) : "A member of the Club"} />
                  <H3>Asks to be your partner.</H3>
                  {p.message && <blockquote className="quote">{p.message}</blockquote>}
                  <div className="row wrap gap-3">
                    <QuickAction action={answerPartnerRequest} fields={{ partnership_id: p.id, answer: "accept" }} variant="primary">
                      Accept
                    </QuickAction>
                    <QuickAction
                      action={answerPartnerRequest}
                      fields={{ partnership_id: p.id, answer: "decline" }}
                      confirm="Decline this request? No reason is owed, and none is recorded."
                    >
                      Decline
                    </QuickAction>
                    <TextLink href="/partner">The particulars</TextLink>
                  </div>
                </Card>
              );
            })}

            {visitsWaiting.map((v) => {
              const them = visitPeople.get(otherPartyOfVisit(v, userId));
              const theyHost = v.hostId !== userId;
              return (
                <Card key={v.id} emphasis>
                  <div className="row between wrap gap-4">
                    <Person
                      name={them?.fullName ?? "A principal"}
                      size="lg"
                      meta={theyHost ? v.practiceName ?? "Their practice" : "Would come to your practice"}
                      href={`/visits/${v.id}`}
                    />
                    <VisitBadge status={v.status} />
                  </div>
                  <H3><time dateTime={v.scheduledAt}>{formatAppointment(v.scheduledAt)}</time></H3>
                  <Caption>{relativeDays(v.scheduledAt)}</Caption>
                  {v.proposalNote && <blockquote className="quote">{v.proposalNote}</blockquote>}
                  <div className="row wrap gap-3">
                    <QuickAction action={answerVisit} fields={{ visit_id: v.id, answer: "agree" }} variant="primary">
                      Agree to the morning
                    </QuickAction>
                    <QuickAction
                      action={answerVisit}
                      fields={{ visit_id: v.id, answer: "decline" }}
                      confirm="Decline this morning? No reason is owed, and none is recorded."
                    >
                      Decline
                    </QuickAction>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      <div className="lg-grid">
        {/* ---------- Your partner ---------- */}
        <Card dark className="lg-partner">
          {partner && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTO.twoPrincipals} alt="" aria-hidden="true" className="lg-partner-bg" />
              <div className="lg-partner-veil" aria-hidden="true" />
            </>
          )}
          <div className="lg-partner-body">
            <p className="eyebrow gold">Your partner</p>
            {partner ? (
              <>
                <div className="row gap-4" style={{ alignItems: "center", marginTop: 18 }}>
                  <span className="avatar lg dark" aria-hidden="true">{initials(partner.fullName)}</span>
                  <div>
                    <p className="lg-partner-name">{partner.fullName}</p>
                    <p className="person-meta">{practiceLine(partner)}</p>
                  </div>
                </div>
                <Body className="muted" style={{ marginTop: 18, maxWidth: "40ch" }}>
                  Either of you can end it and ask somebody else. Nothing is scored, and nothing is kept against you.
                </Body>
                <div className="row wrap gap-3" style={{ marginTop: 22 }}>
                  <Button href="/messages" variant="secondary" size="sm" onDark>
                    Write to {firstName(partner)}
                  </Button>
                  <Button href="/partner" variant="ghost" size="sm" onDark>Their page</Button>
                </div>
              </>
            ) : (
              <>
                <p className="lg-partner-name" style={{ marginTop: 18 }}>You have no partner yet.</p>
                <Body className="muted" style={{ marginTop: 12, maxWidth: "40ch" }}>
                  You find one yourself. Read the directory, pick a principal whose year looks something like yours, and
                  ask them. They accept, or they decline without a reason.
                </Body>
                <div className="row wrap gap-3" style={{ marginTop: 22 }}>
                  <Button href="/members" variant="secondary" size="sm" onDark>Look through the members</Button>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* ---------- The monthly note ---------- */}
        <Card>
          <div className="row between gap-3" style={{ alignItems: "baseline" }}>
            <p className="eyebrow">The monthly note</p>
            <span className="tag">{profile.nudgeOptOut ? "Turned off" : "Once a month"}</span>
          </div>
          <p className="lg-card-title">
            {partner ? `How is ${firstName(partner)} getting on?` : "Nobody to ask about yet."}
          </p>
          <Body className="muted">
            {partner
              ? `Once a month the Club writes to you both and asks. A sentence is plenty, and ${firstName(partner)} gets the same question about you.`
              : "Once you have a partner, the Club writes to you both once a month and asks how the other is getting on."}
          </Body>
          <div className="row wrap gap-3">
            {partner && <Button href="/messages" variant="secondary" size="sm">Answer it</Button>}
            <TextLink href="/settings">{profile.nudgeOptOut ? "Turn it back on" : "Change how often"}</TextLink>
          </div>
        </Card>

        {/* ---------- The lists ---------- */}
        <Card className="lg-span">
          <WhoseList
            theirName={partner ? firstName(partner) : null}
            mineTitle={
              <>
                <p className="eyebrow">What you are working on</p>
                <p className="lg-card-title">
                  {myOpen.length === 0
                    ? "Nothing set down yet."
                    : `${myOpen.length === 1 ? "One line" : `${myOpen.length} lines`}.${partner ? ` ${address(partner)} can see them all.` : ""}`}
                </p>
              </>
            }
            theirsTitle={
              <>
                <p className="eyebrow">What {partner ? address(partner) : "they"} is working on</p>
                <p className="lg-card-title">Write a word against theirs.</p>
              </>
            }
            mine={
              myOpen.length === 0 ? (
                <EmptyState title="Nothing set down yet." action={<Button href="/goals">Set one down</Button>}>
                  Write down what you are working on this year. Your partner can see it and write against it.
                </EmptyState>
              ) : (
                <GoalLines goals={myOpen} updatesFor={updatesFor} nameOf={nameOf} />
              )
            }
            theirs={
              partner
                ? theirOpen.length === 0
                  ? <Caption>{address(partner)} has nothing open at the moment.</Caption>
                  : <GoalLines goals={theirOpen} updatesFor={updatesFor} nameOf={nameOf} />
                : null
            }
          />
          <div className="row wrap gap-3" style={{ marginTop: 18 }}>
            <TextLink href="/goals">All of them</TextLink>
          </div>
        </Card>

        {/* ---------- The two mornings ---------- */}
        <Card className="lg-span">
          <div className="row between wrap gap-4" style={{ alignItems: "flex-end" }}>
            <div>
              <p className="eyebrow">Your two mornings · this year</p>
              <p className="lg-card-title">
                {used === 0 ? "Both still to go." : used >= VISITS_A_YEAR ? "Both spent." : "One done. One still to go."}
              </p>
            </div>
            <Button href="/visits/new" variant="secondary" size="sm">Propose a morning</Button>
          </div>

          <div className="lg-mornings">
            <MorningPanel
              kind={held[0] ? "held" : nextVisit ? "agreed" : "empty"}
              visit={held[0] ?? nextVisit}
              other={held[0] ? null : nextVisitOther}
              userId={userId}
            />
            <MorningPanel kind="open" visit={null} other={null} userId={userId} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function GoalLines({
  goals,
  updatesFor,
  nameOf,
}: {
  goals: Goal[];
  updatesFor: (id: string) => GoalUpdate[];
  nameOf: (id: string) => string;
}) {
  const numerals = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"];
  return (
    <div className="lg-goals">
      {goals.map((g, i) => (
        <div className="lg-goal" key={g.id}>
          <span className="lg-goal-n" aria-hidden="true">{numerals[i] ?? String(i + 1)}</span>
          <div>
            <p className="lg-goal-title">{g.title}</p>
            <LatestUpdate updates={updatesFor(g.id)} nameOf={nameOf} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MorningPanel({
  kind,
  visit,
  other,
  userId,
}: {
  kind: "held" | "agreed" | "empty" | "open";
  visit: Visit | null;
  other: Profile | null;
  userId: string;
}) {
  if (kind === "open" || kind === "empty" || !visit) {
    return (
      <div className="lg-morning empty">
        <div className="lg-morning-slot" aria-hidden="true"><span className="disp-num">II</span></div>
        <div>
          <span className="tag">Open</span>
          <p className="lg-morning-title">Your second morning is still to arrange.</p>
          <Button href="/members" variant="ghost" size="sm">Find a host</Button>
        </div>
      </div>
    );
  }

  const youHost = visit.hostId === userId;
  const held = visit.status === "held";
  return (
    <div className="lg-morning">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={youHost ? PHOTO.reception : PHOTO.surgery} alt="" aria-hidden="true" />
      <div>
        <span className={`tag${held ? " ok" : ""}`}>
          {held ? (youHost ? "Hosted" : "Visited") : relativeDays(visit.scheduledAt)}
        </span>
        <p className="lg-morning-title">
          {youHost
            ? `${other?.fullName ?? "A principal"} ${held ? "spent" : "spends"} a morning in yours.`
            : `A morning in ${visit.practiceName ?? "their practice"}.`}
        </p>
        <p className="person-meta"><time dateTime={visit.scheduledAt}>{formatAppointment(visit.scheduledAt)}</time></p>
        <Button href={`/visits/${visit.id}`} variant="ghost" size="sm">The morning</Button>
      </div>
    </div>
  );
}
