import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { address, firstName, partnerIdOf, type Profile } from "@/lib/domain";
import { addGoal } from "@/lib/actions/goals";
import { Button, Caption, Card, Divider, EmptyState, PageHeader, Section, TextLink } from "@/components/ui";
import { FField, FTextArea, Form, SubmitButton } from "@/components/ui/form";
import { GoalArticle, loadGoals, loadPartnerships, namer } from "../parts";

export const metadata: Metadata = { title: "Your goals" };

export default async function GoalsPage() {
  const { repo, userId, profile } = await requireViewer();
  const { active, people } = await loadPartnerships(repo, userId);
  const partner: Profile | null = active ? people.get(partnerIdOf(active, userId)) ?? null : null;

  const { goals, updatesFor } = await loadGoals(repo, partner ? [userId, partner.id] : [userId]);
  const nameOf = namer(new Map([...people, [userId, profile]]), userId);

  const mine = goals.filter((g) => g.userId === userId);
  const myOpen = mine.filter((g) => g.status === "open");
  const myDone = mine.filter((g) => g.status === "done");
  const theirs = partner ? goals.filter((g) => g.userId === partner.id) : [];
  const theirOpen = theirs.filter((g) => g.status === "open");

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Your goals"
        title="What you are working on."
        lede="Few, plain, and yours. Your partner sees them and may write against them; nobody else does."
      />

      <Section title="Set one down">
        <Card>
          <Form action={addGoal} resetOnSuccess>
            <FField
              label="The goal"
              name="title"
              required
              maxLength={160}
              placeholder="Recruit an associate for two days a week"
            />
            <FTextArea
              label="Detail"
              name="detail"
              rows={2}
              maxLength={600}
              placeholder="Optional. What it actually means, and why now."
            />
            <FField label="Target date" name="target_date" type="date" help="Optional. A goal without a date is still a goal." />
            <div className="form-actions">
              <SubmitButton pendingText="Setting it down…">Set it down</SubmitButton>
            </div>
          </Form>
        </Card>
      </Section>

      <Section title={`Open · ${myOpen.length}`}>
        {myOpen.length === 0 ? (
          <EmptyState title="Nothing open.">
            Nothing is set down at present. One or two goals kept honestly are worth more than a list.
          </EmptyState>
        ) : (
          <div className="stack gap-5">
            {myOpen.map((g) => (
              <GoalArticle
                key={g.id}
                goal={g}
                updates={updatesFor(g.id)}
                nameOf={nameOf}
                mine
                writePrompt="How is it getting on"
              />
            ))}
          </div>
        )}
      </Section>

      {myDone.length > 0 && (
        <Section title={`Done · ${myDone.length}`} aside={<Caption>Kept, and worth keeping in sight.</Caption>}>
          <div className="stack gap-5">
            {myDone.map((g) => (
              <GoalArticle
                key={g.id}
                goal={g}
                updates={updatesFor(g.id)}
                nameOf={nameOf}
                mine
                writePrompt="A last word on it"
              />
            ))}
          </div>
        </Section>
      )}

      <Divider />

      <Section
        title={partner ? `What ${address(partner)} is working on` : "Your partner's goals"}
        aside={partner ? <TextLink href="/partner">Their page</TextLink> : undefined}
      >
        {!partner ? (
          <EmptyState title="No partner yet." action={<Button href="/members">Look through the members</Button>}>
            Once you have a partner, their goals sit here and you may write against each one.
          </EmptyState>
        ) : theirOpen.length === 0 ? (
          <EmptyState title={`${address(partner)} has nothing open.`}>
            Nothing is set down on their side at the moment.
          </EmptyState>
        ) : (
          <div className="stack gap-5">
            {theirOpen.map((g) => (
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
    </div>
  );
}
