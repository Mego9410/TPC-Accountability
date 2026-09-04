import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/session";
import { CADENCE_LABEL, CIRCLE_ROLE_LABEL, type CircleRole } from "@/lib/domain";
import { seatMember } from "@/lib/actions/house";
import { formatLongDate } from "@/lib/weeks";
import { SubNav } from "@/components/shell/nav";
import { Badge, Caption, Card, EmptyState, Eyebrow, H3, PageHeader, Person, RoleBadge, Section, Select, TextLink } from "@/components/ui";
import { Form, QuickAction, SubmitButton } from "@/components/ui/form";
import { CIRCLE_KIND_LABEL, HOUSE_NAV } from "@/lib/house";

export const metadata: Metadata = { title: "Circle" };

const PAIR_ROLES: CircleRole[] = ["mentee", "mentor", "peer"];
const POD_ROLES: CircleRole[] = ["peer", "lead"];

export default async function HouseCirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repo } = await requireViewer({ roles: ["staff"] });
  const [circle, profiles] = await Promise.all([repo.getCircle(id), repo.listAllProfiles()]);
  if (!circle) notFound();

  const seated = new Set(circle.members.map((m) => m.userId));
  const unseated = profiles.filter((p) => !seated.has(p.id)).sort((a, b) => a.fullName.localeCompare(b.fullName));
  const roles = circle.kind === "pair" ? PAIR_ROLES : POD_ROLES;
  const roleOptions = roles.map((r) => ({ value: r, label: CIRCLE_ROLE_LABEL[r] }));
  const pairFull = circle.kind === "pair" && circle.members.length >= 2;
  const lede = [
    `${CIRCLE_KIND_LABEL[circle.kind]}`,
    `sits ${CADENCE_LABEL[circle.cadence].toLowerCase()}`,
    circle.cohortLabel,
    `formed ${formatLongDate(circle.createdAt)}`,
  ].filter((p): p is string => Boolean(p)).join(" · ");

  return (
    <div className="section fade-enter">
      <SubNav items={HOUSE_NAV} />
      <TextLink href="/house/circles" back>All circles</TextLink>
      <PageHeader
        eyebrow={
          <span className="row gap-2 wrap">
            <Badge tone={circle.kind === "pod" ? "gold" : ""} dot={false}>{CIRCLE_KIND_LABEL[circle.kind]}</Badge>
            {circle.status !== "active" && <Badge tone="muted" dot={false}>Archived</Badge>}
          </span>
        }
        title={circle.name}
        lede={`${lede}.`}
      />

      <div className="grid-sidebar">
        <Section title={`${circle.members.length} seated`}>
          {circle.kind === "pair" && (
            <Caption>A pair has two seats{pairFull ? ", both taken. Vacate one before seating another principal." : `; ${2 - circle.members.length === 2 ? "both are" : "one is"} free.`}</Caption>
          )}
          {circle.members.length === 0 ? (
            <EmptyState title="No one is seated.">Seat the first principal from the form alongside.</EmptyState>
          ) : (
            <div>
              {circle.members.map((m) => (
                <div key={m.userId} className="seat-row">
                  <Person
                    name={m.profile.fullName}
                    meta={
                      <>
                        {m.profile.practiceName ?? "Principal"} · since <time dateTime={m.joinedAt}>{formatLongDate(m.joinedAt)}</time>
                      </>
                    }
                    trailing={<RoleBadge role={m.role} />}
                  />
                  <div className="seat-actions">
                    <Form action={seatMember} className="compact">
                      <input type="hidden" name="circle_id" value={circle.id} />
                      <input type="hidden" name="user_id" value={m.userId} />
                      <Select label={`Role for ${m.profile.fullName}`} hideLabel name="role" options={roleOptions} defaultValue={m.role} />
                      <SubmitButton size="sm" variant="secondary">Save</SubmitButton>
                    </Form>
                    <QuickAction
                      action={seatMember}
                      fields={{ circle_id: circle.id, user_id: m.userId, role: "remove" }}
                      confirm={`Vacate ${m.profile.fullName}'s seat in ${circle.name}? Their record is kept; only the seat is given up.`}
                    >
                      Vacate the seat
                    </QuickAction>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Card emphasis={!pairFull && circle.members.length < (circle.kind === "pair" ? 2 : 6)}>
          <Eyebrow>Seat a principal</Eyebrow>
          {pairFull ? (
            <>
              <H3>Both seats are taken.</H3>
              <Caption>Vacate a seat above to make room, or form another pair.</Caption>
            </>
          ) : unseated.length === 0 ? (
            <>
              <H3>Everyone is already seated here.</H3>
              <Caption>There is no principal on the books who is not in this circle.</Caption>
            </>
          ) : (
            <Form action={seatMember} resetOnSuccess>
              <input type="hidden" name="circle_id" value={circle.id} />
              <Select
                label="Principal"
                name="user_id"
                placeholder="Choose a principal"
                required
                options={unseated.map((p) => ({ value: p.id, label: `${p.fullName}${p.practiceName ? ` · ${p.practiceName}` : ""}` }))}
              />
              <Select label="Role" name="role" options={roleOptions} defaultValue={circle.kind === "pair" ? "mentee" : "peer"} />
              <div className="form-actions">
                <SubmitButton size="sm">Seat</SubmitButton>
              </div>
              <Caption>
                {circle.kind === "pair"
                  ? "A mentor sees their mentee's blocks, check-ins and wins. Two partners see only what they share in the sitting."
                  : "Pod members see each other's check-ins and wins. The lead convenes the sitting."}
              </Caption>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
