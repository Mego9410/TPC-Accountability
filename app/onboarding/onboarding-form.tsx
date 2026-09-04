"use client";

import type { Profile } from "@/lib/domain";
import { completeOnboarding } from "@/lib/actions/profile";
import { FOCUS_AREAS, HONORIFICS, TIMES, TIMEZONES, YEARS_AS_PRINCIPAL } from "@/lib/options";
import { PRACTICE_TYPES, REGIONS } from "@/lib/benchmarks";
import { Caption, CheckboxGroup, ChoiceCards, Field, H2, Select, TextArea } from "@/components/ui";
import { Form, SubmitButton } from "@/components/ui/form";

export function OnboardingForm({ profile, wants }: { profile: Profile; wants: "mentee" | "peer" | "mentor" }) {
  return (
        <Form action={completeOnboarding}>
      {(state) => (
        <>
          <section className="stack gap-5">
            <H2>How you would like to take part</H2>
            <ChoiceCards
              name="wants"
              legend="Choose one"
              defaultValue={wants}
              error={state.errors.wants}
              options={[
                { value: "mentee", title: "I want a mentor", detail: "A principal who has done the hard years, fortnightly sittings, and a pod of six." },
                { value: "peer", title: "I want a partner", detail: "Another principal at a similar stage. You hold each other to it." },
                { value: "mentor", title: "I want to mentor", detail: "One or two mentees, a pod to lead, no fee either way." },
              ]}
            />
          </section>

          <section className="stack gap-5">
            <H2>Who you are</H2>
            <div className="form-row">
              <Select label="Honorific" name="honorific" defaultValue={profile.honorific || "Dr"} options={HONORIFICS.map((h) => ({ value: h, label: h }))} />
              <Field label="Your name" name="full_name" defaultValue={profile.fullName === "Principal" ? "" : profile.fullName} placeholder="Jordan Cheng" required error={state.errors.full_name} />
            </div>
            <Select label="Time zone" name="timezone" defaultValue={profile.timezone} options={TIMEZONES.map((t) => ({ value: t, label: t.replace("_", " ") }))} />
            <TextArea label="A short note on your practice" name="bio" rows={3} defaultValue={profile.bio ?? ""} placeholder="Two surgeries in central London. Working towards a treatment coordinator model." error={state.errors.bio} />
          </section>

          <section className="stack gap-5">
            <H2>Your practice</H2>
            <Field label="Practice name" name="practice_name" defaultValue={profile.practiceName ?? ""} placeholder="Cheng Dental, Marylebone" />
            <div className="form-row">
              <Select label="Region" name="region" placeholder="Choose a region" defaultValue={profile.region ?? ""} options={REGIONS.map((r) => ({ value: r, label: r }))} help="Places you in a like-for-like benchmark cohort." error={state.errors.region} />
              <Select label="Practice type" name="practice_type" placeholder="Choose one" defaultValue={profile.practiceType ?? ""} options={PRACTICE_TYPES.map((p) => ({ value: p, label: p }))} error={state.errors.practice_type} />
            </div>
            <div className="form-row">
              <Field label="Chairs" name="chair_count" type="number" min={1} max={60} defaultValue={profile.chairCount ?? ""} placeholder="4" />
              <Select label="Years as a principal" name="years_as_principal" placeholder="Choose one" defaultValue={profile.yearsAsPrincipal ?? ""} options={YEARS_AS_PRINCIPAL.map((y) => ({ value: y.value, label: y.label }))} />
            </div>
          </section>

          <section className="stack gap-5">
            <H2>What you are working on</H2>
            <CheckboxGroup label="Your focus this year" name="focus" options={FOCUS_AREAS} defaultValue={profile.focusAreas} error={state.errors.focus} help="Choose up to three." />
            <div className="form-row">
              <Select label="How often you can sit" name="cadence" defaultValue={profile.cadence} options={[{ value: "weekly", label: "Weekly" }, { value: "fortnightly", label: "Fortnightly" }, { value: "monthly", label: "Monthly" }]} />
            </div>
            <CheckboxGroup label="When suits you" name="times" options={TIMES} defaultValue={profile.preferredTimes} columns={3} />
          </section>

          <section className="stack gap-5">
            <H2>Mentoring</H2>
            <Caption>Only if you are offering to mentor. Otherwise leave this blank.</Caption>
            <div className="form-row">
              <Select label="How many mentees" name="mentor_capacity" placeholder="—" defaultValue={profile.mentorCapacity ?? ""} options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))} />
            </div>
            <TextArea label="A note to your mentees" name="mentor_note" rows={3} defaultValue={profile.mentorNote ?? ""} placeholder="I ask a lot of questions and very rarely give advice." help="Shown to mentees before they are seated with you." />
          </section>

          <div className="form-actions">
            <SubmitButton pendingText="Lodging your particulars…">Put me forward</SubmitButton>
            <Caption>You may revise any of this later from your particulars.</Caption>
          </div>
        </>
      )}
    </Form>
  );
}
