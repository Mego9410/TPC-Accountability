import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { VISITS_A_YEAR, practiceLine, visitsThisYear } from "@/lib/domain";
import { proposeVisit } from "@/lib/actions/visits";
import { toLocalInputValue } from "@/lib/weeks";
import { Body, Caption, Card, Divider, EmptyState, Notice, PageHeader, Section, TextLink } from "@/components/ui";
import { FField, FSelect, FTextArea, Form, SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "Propose a morning" };

/** Half past eight, about three weeks out. Near enough to mean it, far enough to arrange. */
function defaultMorning(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 21);
  d.setHours(8, 30, 0, 0);
  return toLocalInputValue(d);
}

export default async function NewVisitPage({ searchParams }: { searchParams: Promise<{ host?: string }> }) {
  const { repo, userId, profile } = await requireViewer();
  const { host } = await searchParams;

  const [members, visits] = await Promise.all([repo.listMembers(), repo.listVisitsFor(userId)]);
  const others = members.filter((m) => m.id !== userId);
  const hosts = others.filter((m) => m.openToVisits);
  const preselected = host && hosts.some((h) => h.id === host) ? host : "";
  const when = defaultMorning();

  const used = visitsThisYear(visits, userId);
  const atCeiling = used >= VISITS_A_YEAR;

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Companion visits"
        title="Propose a morning."
        lede="Half past eight to lunch, inside a working practice. Ask to go, or offer to have somebody come to you."
        actions={<TextLink href="/visits" back>All the mornings</TextLink>}
      />

      <Caption className="maxw-prose">
        Two a year is the ceiling, counted over the last twelve months and counting host and visitor alike. Nobody hosts a
        competitor: if your practices draw on the same high street, propose someone further afield.
      </Caption>

      {atCeiling && (
        <Notice tone="warn">
          You have had your {VISITS_A_YEAR} mornings in the last twelve months. The ceiling frees up twelve months after
          the first of them.
        </Notice>
      )}

      {others.length === 0 ? (
        <EmptyState title="There is nobody else to ask yet.">
          The Club is small at present. Look in again when there are more principals in the directory.
        </EmptyState>
      ) : (
        <>
          <Section title="Ask to visit somebody">
            <Card>
              {hosts.length === 0 ? (
                <EmptyState title="No principal is receiving visitors at present.">
                  Nobody has their door open just now. You may still offer to host below.
                </EmptyState>
              ) : (
                <Form action={proposeVisit}>
                  <FSelect
                    label="Whose practice"
                    name="host_id"
                    defaultValue={preselected}
                    placeholder="Choose a principal"
                    required
                    options={hosts.map((h) => ({ value: h.id, label: `${h.fullName} — ${practiceLine(h) || "practice not given"}` }))}
                    help="Only principals who are open to visitors are listed."
                  />
                  <FField
                    label="The morning"
                    name="scheduled_at"
                    type="datetime-local"
                    defaultValue={when}
                    required
                    help="Half past eight, about three weeks out. Move it to suit."
                  />
                  <FTextArea
                    label="A word with the request"
                    name="proposal_note"
                    rows={3}
                    maxLength={600}
                    placeholder="What you hope to see. The diary, the huddle, the way the phone is answered."
                  />
                  <div className="form-actions">
                    <SubmitButton pendingText="Asking…">Ask for the morning</SubmitButton>
                    <Caption>They may accept or decline, and owe you no reason either way.</Caption>
                  </div>
                </Form>
              )}
            </Card>
          </Section>

          <Divider />

          <Section title="Offer to host somebody">
            <Card>
              {profile.openToVisits ? (
                <Form action={proposeVisit}>
                  <input type="hidden" name="host_id" value={userId} />
                  <FSelect
                    label="Whom to invite"
                    name="visitor_id"
                    placeholder="Choose a principal"
                    required
                    options={others.map((m) => ({ value: m.id, label: `${m.fullName} — ${practiceLine(m) || "practice not given"}` }))}
                  />
                  <FField
                    label="The morning"
                    name="scheduled_at"
                    type="datetime-local"
                    defaultValue={when}
                    required
                    help="Pick a day your practice is itself, not a day you have tidied for."
                  />
                  <FTextArea
                    label="A word with the offer"
                    name="proposal_note"
                    rows={3}
                    maxLength={600}
                    placeholder="What they would see, and what they should not expect."
                  />
                  <div className="form-actions">
                    <SubmitButton variant="secondary" pendingText="Offering…">Offer the morning</SubmitButton>
                  </div>
                </Form>
              ) : (
                <>
                  <Body className="muted maxw-prose">
                    Your particulars say you are not receiving visitors at present, so you cannot offer to host. Change
                    that whenever you like.
                  </Body>
                  <div className="row wrap gap-3">
                    <TextLink href="/settings">Your particulars</TextLink>
                  </div>
                </>
              )}
            </Card>
          </Section>
        </>
      )}
    </div>
  );
}
