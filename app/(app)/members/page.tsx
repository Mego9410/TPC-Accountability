import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/lib/session";
import { address, firstName, partnerIdOf, type Profile } from "@/lib/domain";
import { askToPartner } from "@/lib/actions/partners";
import { REGIONS } from "@/lib/regions";
import { Badge, Button, Caption, Card, EmptyState, PageHeader, Person, Section } from "@/components/ui";
import { FTextArea, Form, SubmitButton } from "@/components/ui/form";
import { Particulars, loadPartnerships } from "../parts";

export const metadata: Metadata = { title: "The members" };

type Query = { region?: string; open?: string };

function href(current: Query, patch: Query): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.region) params.set("region", next.region);
  if (next.open) params.set("open", next.open);
  const q = params.toString();
  return q ? `/members?${q}` : "/members";
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<Query> }) {
  const { repo, userId } = await requireViewer();
  const raw = await searchParams;
  const region = raw.region && REGIONS.includes(raw.region) ? raw.region : undefined;
  const openOnly = raw.open === "partner";
  const current: Query = { region, open: openOnly ? "partner" : undefined };

  const [everyone, { active, incoming, outgoing }] = await Promise.all([
    repo.listMembers(),
    loadPartnerships(repo, userId),
  ]);

  const spokenFor = new Set<string>();
  for (const p of [...incoming, ...outgoing]) spokenFor.add(partnerIdOf(p, userId));
  const partnerId = active ? partnerIdOf(active, userId) : null;

  const members = everyone
    .filter((m) => m.id !== userId)
    .filter((m) => (region ? m.region === region : true))
    .filter((m) => (openOnly ? m.openToPartner : true));

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="The members"
        title="Every principal in the Club."
        lede="Read them properly before you ask. A partner is chosen, not allocated, and a morning in somebody's practice is a favour freely given."
      />

      <nav className="filter-bar" aria-label="Filter the members">
        <span className="lbl">Region</span>
        <Link href={href(current, { region: undefined })} aria-current={region ? undefined : "page"}>
          All
        </Link>
        {REGIONS.map((r) => (
          <Link key={r} href={href(current, { region: r })} aria-current={region === r ? "page" : undefined}>
            {r}
          </Link>
        ))}
      </nav>
      <nav className="filter-bar" aria-label="Filter by willingness">
        <span className="lbl">Showing</span>
        <Link href={href(current, { open: undefined })} aria-current={openOnly ? undefined : "page"}>
          Everyone
        </Link>
        <Link href={href(current, { open: "partner" })} aria-current={openOnly ? "page" : undefined}>
          Open to a partner
        </Link>
      </nav>

      <Section
        title={`${members.length} ${members.length === 1 ? "principal" : "principals"}`}
        aside={<Caption>Your own card is not shown.</Caption>}
      >
        {members.length === 0 ? (
          <EmptyState title="No principal matches that." action={<Button href="/members" variant="secondary">Show everyone</Button>}>
            Try another region, or take the filters off.
          </EmptyState>
        ) : (
          <div className="card-grid">
            {members.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                isPartner={m.id === partnerId}
                pending={spokenFor.has(m.id)}
                hasPartner={active !== null}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function MemberCard({
  member,
  isPartner,
  pending,
  hasPartner,
}: {
  member: Profile;
  isPartner: boolean;
  pending: boolean;
  hasPartner: boolean;
}) {
  const canAsk = member.openToPartner && !hasPartner && !pending;
  return (
    <Card as="article" className="member-card">
      <Person name={member.fullName} size="md" meta={member.practiceName ?? "A member of the Club"} />
      <div className="grow stack gap-3">
        <Particulars profile={member} />
      </div>

      <div className="badge-row start">
        {isPartner && <Badge tone="gold" dot={false}>Your partner</Badge>}
        {member.openToPartner ? (
          <Badge tone="ok">Open to a partner</Badge>
        ) : (
          <Badge tone="muted">Not looking for a partner</Badge>
        )}
        {member.openToVisits ? <Badge tone="ok">Open to visits</Badge> : <Badge tone="muted">Not receiving visitors</Badge>}
      </div>

      <div className="card-actions">
        {canAsk && (
          <details className="disclosure">
            <summary>Ask to partner</summary>
            <div className="disclosure-body">
              <Form action={askToPartner} resetOnSuccess>
                <input type="hidden" name="user_id" value={member.id} />
                <FTextArea
                  label={`A word for ${firstName(member)}`}
                  name="message"
                  rows={3}
                  maxLength={600}
                  placeholder="Why you are asking. A sentence will do."
                />
                <div className="form-actions">
                  <SubmitButton variant="primary" size="sm" pendingText="Asking…">
                    Ask {address(member)}
                  </SubmitButton>
                </div>
              </Form>
            </div>
          </details>
        )}
        {pending && <Caption>A request is already in hand with {address(member)}.</Caption>}
        {!member.openToPartner && !isPartner && !pending && (
          <Caption>{address(member)} is not looking for a partner at present.</Caption>
        )}
        {hasPartner && member.openToPartner && !isPartner && !pending && (
          <Caption>End your current partnership before you take up another.</Caption>
        )}
        {member.openToVisits && (
          <Button href={`/visits/new?host=${member.id}`} variant="secondary" size="sm">
            Ask to visit
          </Button>
        )}
      </div>
    </Card>
  );
}
