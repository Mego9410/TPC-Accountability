import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import {
  address,
  awaitingAnswerFrom,
  firstName,
  otherPartyOfVisit,
  partnerIdOf,
  practiceLine,
  type Profile,
  type Visit,
} from "@/lib/domain";
import { answerPartnerRequest } from "@/lib/actions/partners";
import { answerVisit } from "@/lib/actions/visits";
import { formatAppointment, relativeDays } from "@/lib/weeks";
import {
  Body, Button, Caption, Card, Divider, EmptyState, GoalBadge, H3, PageHeader, Person, Section, TextLink, VisitBadge,
} from "@/components/ui";
import { QuickAction } from "@/components/ui/form";
import { LatestUpdate, loadGoals, loadPartnerships, namer } from "../parts";

export const metadata: Metadata = { title: "Home" };

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
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

  const nameOf = namer(new Map([...people, ...visitPeople]), userId);
  const waiting = incoming.length + visitsWaiting.length;

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="The Principals Club"
        title={`${greeting(new Date())}, ${firstName(profile)}.`}
        lede={
          waiting > 0
            ? `${waiting === 1 ? "One thing is" : `${waiting} things are`} waiting on you.`
            : "Nothing is waiting on you. Here is where everything stands."
        }
      />

      {waiting > 0 && (
        <Section title="Waiting on you">
          <div className="stack gap-5">
            {incoming.map((p) => {
              const them = people.get(partnerIdOf(p, userId));
              return (
                <Card key={p.id} emphasis>
                  <Person
                    name={them?.fullName ?? "A principal"}
                    size="lg"
                    meta={them ? practiceLine(them) : "A member of the Club"}
                  />
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
                  <H3>
                    <time dateTime={v.scheduledAt}>{formatAppointment(v.scheduledAt)}</time>
                  </H3>
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

      <Divider />

      <Section title="Your partner" aside={partner && <TextLink href="/partner">Their page</TextLink>}>
        {partner ? (
          <Card>
            <Person name={partner.fullName} size="lg" meta={practiceLine(partner)} href="/partner" />
            <Divider tight />
            {theirOpen.length === 0 ? (
              <Caption>{address(partner)} has nothing open at the moment.</Caption>
            ) : (
              <div className="stack gap-4">
                <Caption>What {address(partner)} is working on</Caption>
                {theirOpen.map((g) => (
                  <div key={g.id} className="row between wrap gap-3">
                    <span className="person-name">{g.title}</span>
                    <GoalBadge status={g.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <EmptyState
            title="You have no partner yet."
            action={<Button href="/members">Look through the members</Button>}
          >
            You find one yourself. Read the directory, pick someone whose practice interests you, and ask.
          </EmptyState>
        )}
      </Section>

      <Section title="Your goals" aside={<TextLink href="/goals">All of them</TextLink>}>
        {myOpen.length === 0 ? (
          <EmptyState title="Nothing set down yet." action={<Button href="/goals">Set one down</Button>}>
            Write down what you are working on this year. Your partner can see it and write against it.
          </EmptyState>
        ) : (
          <div className="stack gap-5">
            {myOpen.map((g) => (
              <Card key={g.id} className="goal-card">
                <div className="goal-head">
                  <h3 className="goal-title">{g.title}</h3>
                  <GoalBadge status={g.status} />
                </div>
                <LatestUpdate updates={updatesFor(g.id)} nameOf={nameOf} />
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Your next visit" aside={<TextLink href="/visits">All the mornings</TextLink>}>
        {nextVisit ? (
          <NextVisit visit={nextVisit} other={nextVisitOther} userId={userId} />
        ) : (
          <EmptyState title="No visit arranged." action={<Button href="/visits/new">Propose a morning</Button>}>
            A morning inside another practice, and in turn one inside yours. Twice a year at most.
          </EmptyState>
        )}
      </Section>
    </div>
  );
}

function NextVisit({ visit, other, userId }: { visit: Visit; other: Profile | null; userId: string }) {
  const youHost = visit.hostId === userId;
  return (
    <Card>
      <div className="row between wrap gap-4">
        <Person
          name={other?.fullName ?? "A principal"}
          size="lg"
          meta={youHost ? "Coming to your practice" : visit.practiceName ?? "Their practice"}
          href={`/visits/${visit.id}`}
        />
        <VisitBadge status={visit.status} />
      </div>
      <H3>
        <time dateTime={visit.scheduledAt}>{formatAppointment(visit.scheduledAt)}</time>
      </H3>
      <Caption>
        {relativeDays(visit.scheduledAt)} · {youHost ? "You are the host" : "You are the visitor"}
      </Caption>
      {visit.arrivalNote && <Body className="muted">{visit.arrivalNote}</Body>}
      <div className="row wrap gap-3">
        <Button href={`/visits/${visit.id}`} variant="secondary" size="sm">The morning</Button>
      </div>
    </Card>
  );
}
