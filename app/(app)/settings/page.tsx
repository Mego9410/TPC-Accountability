import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { MEMBER_ROLE_LABEL } from "@/lib/domain";
import { updateParticulars } from "@/lib/actions/profile";
import { FOCUS_AREAS, HONORIFICS, TIMEZONES } from "@/lib/options";
import { PRACTICE_TYPES, REGIONS } from "@/lib/regions";
import { Body, Caption, Card, Checkbox, CheckboxGroup, Divider, H2, PageHeader, Section } from "@/components/ui";
import { FField, FSelect, FTextArea, FieldError, Form, SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "Your particulars" };

export default async function SettingsPage() {
  const { profile } = await requireViewer();

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Your particulars"
        title="How you are known here."
        lede="Your name, your practice and what you are working on are read by other members deciding whether to ask you. Nothing else is shown."
      />

      <Card>
        <dl className="facts">
          <div>
            <dt>Membership</dt>
            <dd>No. {profile.membershipNo}</dd>
          </div>
          <div>
            <dt>Standing</dt>
            <dd>{MEMBER_ROLE_LABEL[profile.role]}</dd>
          </div>
          {profile.email && (
            <div>
              <dt>Correspondence</dt>
              <dd>{profile.email}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Form action={updateParticulars}>
        <Section title="Who you are">
          <div className="form-row">
            <FSelect
              label="Honorific"
              name="honorific"
              defaultValue={profile.honorific || "Dr"}
              options={HONORIFICS.map((h) => ({ value: h, label: h }))}
            />
            <FField label="Your name" name="full_name" defaultValue={profile.fullName} required maxLength={80} />
          </div>
          <FSelect
            label="Time zone"
            name="timezone"
            defaultValue={profile.timezone}
            options={TIMEZONES.map((t) => ({ value: t, label: t.replace("_", " ") }))}
          />
          <FTextArea
            label="A short note on your practice"
            name="bio"
            rows={3}
            maxLength={600}
            defaultValue={profile.bio ?? ""}
            help="Read by anyone deciding whether to ask you to partner, or to spend a morning with you."
          />
        </Section>

        <Section title="Your practice">
          <FField label="Practice name" name="practice_name" defaultValue={profile.practiceName ?? ""} maxLength={120} />
          <div className="form-row">
            <FSelect
              label="Region"
              name="region"
              placeholder="Choose a region"
              defaultValue={profile.region ?? ""}
              options={REGIONS.map((r) => ({ value: r, label: r }))}
            />
            <FSelect
              label="Practice type"
              name="practice_type"
              placeholder="Choose one"
              defaultValue={profile.practiceType ?? ""}
              options={PRACTICE_TYPES.map((p) => ({ value: p, label: p }))}
            />
          </div>
          <div className="form-row">
            <FField
              label="Chairs"
              name="chair_count"
              type="number"
              min={1}
              max={60}
              defaultValue={profile.chairCount ?? ""}
            />
            <FField
              label="Years as a principal"
              name="years_as_principal"
              type="number"
              min={0}
              max={60}
              defaultValue={profile.yearsAsPrincipal ?? ""}
            />
          </div>
        </Section>

        <Section title="What you are working on">
          <CheckboxGroup label="Your focus" name="focus" options={FOCUS_AREAS} defaultValue={profile.focusAreas} />
          <FieldError name="focus" />
        </Section>

        <Section title="What you are open to">
          <Checkbox
            label="Open to a partner"
            name="open_to_partner"
            defaultChecked={profile.openToPartner}
            help="Shown in the directory, so another principal knows they may ask."
          />
          <Checkbox
            label="Open to visits"
            name="open_to_visits"
            defaultChecked={profile.openToVisits}
            help="Whether you are willing to have a principal spend a morning in your practice at present."
          />
          <Checkbox
            label="Do not send the monthly note"
            name="nudge_opt_out"
            defaultChecked={profile.nudgeOptOut}
            help="The monthly note asks how your goals are getting on. Nothing else is sent."
          />
        </Section>

        <div className="form-actions">
          <SubmitButton pendingText="Revising…">Save your particulars</SubmitButton>
        </div>
      </Form>

      <Divider />

      <Section title="Leaving">
        <Card>
          <H2>Sign out</H2>
          <Body className="muted maxw-prose">Your seat is kept, and everything here waits for you.</Body>
          <div className="row wrap gap-3">
            <a className="btn secondary sm" href="/auth/signout">Sign out</a>
          </div>
          <Caption>The House can be written to at house@principalsclub.co.uk.</Caption>
        </Card>
      </Section>
    </div>
  );
}
