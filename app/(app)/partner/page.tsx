import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { address, firstName, partnerIdOf, type Profile } from "@/lib/domain";
import { answerPartnerRequest, endPartnership, withdrawPartnerRequest } from "@/lib/actions/partners";
import { formatLongDate } from "@/lib/weeks";
import {
  Body, Button, Caption, Card, Divider, EmptyState, PageHeader, PartnershipBadge, Person, Section, TextLink,
} from "@/components/ui";
import { QuickAction } from "@/components/ui/form";
import { GoalArticle, Particulars, loadGoals, loadPartnerships, namer } from "../parts";

export const metadata: Metadata = { title: "Your partner" };

export default async function PartnerPage() {
  const { repo, userId, profile } = await requireViewer();
  const { active, incoming, outgoing, people } = await loadPartnerships(repo, userId);
  const partner: Profile | null = active ? people.get(partnerIdOf(active, userId)) ?? null : null;

  const { goals, updatesFor } = await loadGoals(repo, partner ? [partner.id] : []);
  const nameOf = namer(new Map([...people, [userId, profile]]), userId);
  const open = goals.filter((g) => g.status === "open");
  const done = goals.filter((g) => g.status === "done");

  const nothing = !active && incoming.length === 0 && outgoing.length === 0;

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Your partner"
        title={partner ? `You and ${address(partner)}.` : "One partner at a time."}
        lede={
          partner
            ? "You each see what the other is working on, and either may write against it. Plainly, and without ceremony."
            : "Another principal who keeps an eye on whether you are getting on with what you said you would do. You find them yourself."
        }
        actions={partner ? <Button href={`/messages?with=${partner.id}`} variant="secondary">Write to {firstName(partner)}</Button> : undefined}
      />

      {incoming.length > 0 && (
        <Section title="Waiting on you">
          <div className="stack gap-5">
            {incoming.map((p) => {
              const them = people.get(partnerIdOf(p, userId));
              return (
                <Card key={p.id} emphasis>
                  <div className="row between wrap gap-4">
                    <Person name={them?.fullName ?? "A principal"} size="lg" meta={`Asked ${formatLongDate(p.createdAt)}`} />
                    <PartnershipBadge status={p.status} />
                  </div>
                  {them && <Particulars profile={them} />}
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
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title="Waiting on them" aside={<Caption>They may decline, and owe you no reason.</Caption>}>
          <div className="stack gap-5">
            {outgoing.map((p) => {
              const them = people.get(partnerIdOf(p, userId));
              return (
                <Card key={p.id}>
                  <div className="row between wrap gap-4">
                    <Person name={them?.fullName ?? "A principal"} size="md" meta={`You asked ${formatLongDate(p.createdAt)}`} />
                    <PartnershipBadge status={p.status} />
                  </div>
                  {p.message && <blockquote className="quote">{p.message}</blockquote>}
                  <div className="row wrap gap-3">
                    <QuickAction
                      action={withdrawPartnerRequest}
                      fields={{ partnership_id: p.id }}
                      confirm="Withdraw this request? They will not be told."
                    >
                      Withdraw the request
                    </QuickAction>
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {active && partner && (
        <>
          <Section title="Their particulars">
            <Card>
              <div className="row between wrap gap-4">
                <Person name={partner.fullName} size="lg" meta={partner.email ?? "A member of the Club"} />
                <PartnershipBadge status={active.status} />
              </div>
              <Particulars profile={partner} />
              {active.startedAt && <Caption>Partners since {formatLongDate(active.startedAt)}.</Caption>}
              <div className="row wrap gap-3">
                <Button href={`/messages?with=${partner.id}`} variant="secondary" size="sm">Write to {firstName(partner)}</Button>
                <Button href={`/visits/new?host=${partner.id}`} variant="quiet" size="sm">Ask for a morning</Button>
              </div>
            </Card>
          </Section>

          <Divider />

          <Section
            title={`What ${address(partner)} is working on`}
            aside={<Caption>You may write against any of these.</Caption>}
          >
            {open.length === 0 ? (
              <EmptyState title="Nothing open at the moment.">
                {address(partner)} has set nothing down. A word from you might be the prompt.
              </EmptyState>
            ) : (
              <div className="stack gap-5">
                {open.map((g) => (
                  <GoalArticle
                    key={g.id}
                    goal={g}
                    updates={updatesFor(g.id)}
                    nameOf={nameOf}
                    mine={false}
                    writePrompt={`A word for ${firstName(partner)}`}
                  />
                ))}
              </div>
            )}
          </Section>

          {done.length > 0 && (
            <Section title="Done">
              <div className="stack gap-5">
                {done.map((g) => (
                  <GoalArticle
                    key={g.id}
                    goal={g}
                    updates={updatesFor(g.id)}
                    nameOf={nameOf}
                    mine={false}
                    writePrompt={`A word for ${firstName(partner)}`}
                  />
                ))}
              </div>
            </Section>
          )}

          <Section title="Ending it">
            <details className="disclosure">
              <summary>End the partnership</summary>
              <div className="disclosure-body">
                <Body className="muted maxw-prose">
                  Partnerships end. Nobody is told why, and nothing is recorded beyond the date. You each keep your own
                  goals; you simply stop seeing each other&rsquo;s.
                </Body>
                <div className="row wrap gap-3">
                  <QuickAction
                    action={endPartnership}
                    fields={{ partnership_id: active.id }}
                    confirm={`End your partnership with ${address(partner)}? This cannot be undone.`}
                  >
                    End the partnership
                  </QuickAction>
                </div>
              </div>
            </details>
          </Section>
        </>
      )}

      {nothing && (
        <Section title="No partner">
          <EmptyState title="You have no partner yet." action={<Button href="/members">Look through the members</Button>}>
            Read the directory, find a principal whose practice interests you, and ask them. They accept or they decline,
            and either is a perfectly ordinary answer.
          </EmptyState>
        </Section>
      )}

      {!active && !nothing && (
        <Section title="While you wait">
          <Caption>
            <TextLink href="/members">The members</TextLink> is where the next one is, if this one comes to nothing.
          </Caption>
        </Section>
      )}
    </div>
  );
}
