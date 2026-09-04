import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/lib/session";
import { CADENCE_LABEL, type Cadence } from "@/lib/domain";
import { createCircle } from "@/lib/actions/house";
import { SubNav } from "@/components/shell/nav";
import { Avatar, Badge, Caption, Card, ChoiceCards, EmptyState, Eyebrow, Field, H3, PageHeader, Section, Select, TextLink } from "@/components/ui";
import { Form, SubmitButton } from "@/components/ui/form";
import { CIRCLE_KIND_LABEL, HOUSE_NAV } from "@/lib/house";

export const metadata: Metadata = { title: "Circles" };

const CADENCE_OPTIONS = (Object.keys(CADENCE_LABEL) as Cadence[]).map((c) => ({ value: c, label: CADENCE_LABEL[c] }));

export default async function HouseCirclesPage() {
  const { repo } = await requireViewer({ roles: ["staff"] });
  const circles = await repo.listAllCircles();
  const active = circles.filter((c) => c.status === "active");
  const archived = circles.filter((c) => c.status !== "active");

  return (
    <div className="section fade-enter">
      <SubNav items={HOUSE_NAV} />
      <PageHeader eyebrow="The House" title="Circles" lede="Every pair and pod in the Club. Open one to seat a principal or change a role." />

      <div className="grid-sidebar">
        <Section title={`${active.length} active ${active.length === 1 ? "circle" : "circles"}`}>
          {active.length === 0 ? (
            <EmptyState title="No circles formed.">Form the first one alongside, then seat the principals who are waiting.</EmptyState>
          ) : (
            <div className="card-grid">
              {active.map((c) => (
                <Card key={c.id} as="article" pad="sm">
                  <div className="row gap-2 wrap">
                    <Badge tone={c.kind === "pod" ? "gold" : ""} dot={false}>{CIRCLE_KIND_LABEL[c.kind]}</Badge>
                    <Badge dot={false}>{CADENCE_LABEL[c.cadence]}</Badge>
                    {c.cohortLabel && <Badge tone="muted" dot={false}>{c.cohortLabel}</Badge>}
                  </div>
                  <Link href={`/house/circles/${c.id}`} className="person">
                    <H3>{c.name}</H3>
                  </Link>
                  {c.members.length === 0 ? (
                    <Caption>No one is seated yet.</Caption>
                  ) : (
                    <div className="row gap-3 wrap">
                      <div className="avatar-row" aria-label={c.members.map((m) => m.profile.fullName).join(", ")} role="img">
                        {c.members.map((m) => <Avatar key={m.userId} name={m.profile.fullName} size="sm" />)}
                      </div>
                      <Caption>{c.members.length} {c.members.length === 1 ? "principal" : "principals"}{c.kind === "pair" && c.members.length < 2 ? " · one seat free" : ""}</Caption>
                    </div>
                  )}
                  <TextLink href={`/house/circles/${c.id}`}>Open</TextLink>
                </Card>
              ))}
            </div>
          )}
          {archived.length > 0 && (
            <Caption>{archived.length} archived {archived.length === 1 ? "circle is" : "circles are"} kept out of view.</Caption>
          )}
        </Section>

        <Card>
          <Eyebrow>Form a circle</Eyebrow>
          <H3>A new pair or pod.</H3>
          <Form action={createCircle}>
            <ChoiceCards
              name="kind"
              legend="Kind"
              defaultValue="pair"
              options={[
                { value: "pair", title: "A pair", detail: "A mentor and a mentee, or two partners. Two seats." },
                { value: "pod", title: "A pod", detail: "Up to six principals and a lead who convenes them." },
              ]}
            />
            <Field label="Name" name="name" placeholder="Cheng · Adesanya, or The Marylebone Six" maxLength={60} required />
            <div className="form-row">
              <Select label="Cadence" name="cadence" options={CADENCE_OPTIONS} defaultValue="fortnightly" />
              <Field label="Cohort" name="cohort_label" placeholder="2026 Q3" maxLength={40} help="Pods only, if you like." />
            </div>
            <div className="form-actions">
              <SubmitButton>Form the circle</SubmitButton>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
