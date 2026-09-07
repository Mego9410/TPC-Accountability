import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/session";
import { completeOnboarding } from "@/lib/actions/profile";
import { FOCUS_AREAS, HONORIFICS, TIMEZONES } from "@/lib/options";
import { PRACTICE_TYPES, REGIONS } from "@/lib/regions";
import { Body, Caption, Checkbox, CheckboxGroup, Divider, Eyebrow, H1, H2 } from "@/components/ui";
import { FField, FSelect, FTextArea, FieldError, Form, SubmitButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "A few particulars" };

export default async function OnboardingPage() {
  const { profile } = await requireViewer({ onboarded: false });
  if (profile.onboarded) redirect("/home");

  return (
    <div className="onboarding">
      <header className="onboarding-bar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/monogram-gold.png" alt="The Principals Club" style={{ height: 44 }} />
      </header>

      <div className="onboarding-body fade-enter">
        <Eyebrow>Your introduction</Eyebrow>
        <H1>A few particulars, then a seat.</H1>
        <Body className="muted">
          Two things happen here. You find another principal to hold you to what you said you would do, and you spend a
          morning inside somebody else&rsquo;s practice while they spend one inside yours. Everyone is both.
        </Body>

        <Divider />

        <Form action={completeOnboarding}>
          <section className="stack gap-5">
            <H2>Who you are</H2>
            <div className="form-row">
              <FSelect
                label="Honorific"
                name="honorific"
                defaultValue={profile.honorific || "Dr"}
                options={HONORIFICS.map((h) => ({ value: h, label: h }))}
              />
              <FField
                label="Your name"
                name="full_name"
                defaultValue={profile.fullName === "Principal" ? "" : profile.fullName}
                placeholder="Jordan Cheng"
                required
                maxLength={80}
              />
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
              placeholder="Two surgeries in central London. Three years in and still working out which decisions are mine to make."
              help="Read by anyone deciding whether to ask you."
            />
          </section>

          <section className="stack gap-5">
            <H2>Your practice</H2>
            <FField
              label="Practice name"
              name="practice_name"
              defaultValue={profile.practiceName ?? ""}
              placeholder="Cheng Dental, Marylebone"
              maxLength={120}
            />
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
              <FField label="Chairs" name="chair_count" type="number" min={1} max={60} defaultValue={profile.chairCount ?? ""} placeholder="4" />
              <FField
                label="Years as a principal"
                name="years_as_principal"
                type="number"
                min={0}
                max={60}
                defaultValue={profile.yearsAsPrincipal ?? ""}
                placeholder="3"
              />
            </div>
          </section>

          <section className="stack gap-5">
            <H2>What you are working on</H2>
            <Caption>Choose at least one. It is what another principal reads first.</Caption>
            <CheckboxGroup label="Your focus this year" name="focus" options={FOCUS_AREAS} defaultValue={profile.focusAreas} />
            <FieldError name="focus" />
          </section>

          <section className="stack gap-5">
            <H2>What you are open to</H2>
            <Checkbox
              label="Open to a partner"
              name="open_to_partner"
              defaultChecked
              help="Other principals may ask you. You are free to decline, and no reason is owed."
            />
            <Checkbox
              label="Open to visits"
              name="open_to_visits"
              defaultChecked={profile.openToVisits}
              help="Whether somebody may spend a morning in your practice. Two a year is the ceiling, both ways."
            />
          </section>

          <div className="form-actions">
            <SubmitButton pendingText="Lodging your particulars…">Take my seat</SubmitButton>
            <Caption>You may revise any of this later from your particulars.</Caption>
          </div>
        </Form>
      </div>
    </div>
  );
}
