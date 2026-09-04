"use client";

import { Form, SubmitButton } from "@/components/ui/form";
import { CheckboxGroup, Eyebrow, Field, Select, TextArea } from "@/components/ui";
import { updateParticulars } from "@/lib/actions/profile";
import { CADENCE_LABEL, type Profile } from "@/lib/domain";
import { FOCUS_AREAS, HONORIFICS, TIMES, TIMEZONES, YEARS_AS_PRINCIPAL } from "@/lib/options";
import { PRACTICE_TYPES, REGIONS } from "@/lib/benchmarks";

const CADENCES = (["weekly", "fortnightly", "monthly"] as const).map((v) => ({ value: v, label: CADENCE_LABEL[v] }));
const CAPACITIES = [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: n === 1 ? "One mentee" : `${["", "", "Two", "Three", "Four", "Five", "Six"][n]} mentees` }));

/** The stored figure snapped to the nearest band the select offers. */
function yearsBand(years: number | null): number | "" {
  if (years == null) return "";
  let band: number | "" = "";
  for (const o of YEARS_AS_PRINCIPAL) if (years >= o.value) band = o.value;
  return band;
}

export function ParticularsForm({ profile }: { profile: Profile }) {
  return (
    <Form action={updateParticulars} className="stack gap-6">
      {(state) => (
        <>
          <section id="who" className="block">
            <div className="block-head"><Eyebrow>Who you are</Eyebrow></div>
            <div className="form-row">
              <Select label="Honorific" name="honorific" options={HONORIFICS.map((h) => ({ value: h, label: h }))} defaultValue={profile.honorific || "Dr"} error={state.errors.honorific} />
              <Field label="Full name" name="full_name" defaultValue={profile.fullName} autoComplete="name" required error={state.errors.full_name} />
            </div>
            <Select label="Time zone" name="timezone" options={TIMEZONES.map((t) => ({ value: t, label: t.replace("_", " ") }))} defaultValue={profile.timezone} error={state.errors.timezone} />
            <TextArea label="A line about you" name="bio" defaultValue={profile.bio ?? ""} rows={3} maxLength={400} help="Shown to the principals you sit with." error={state.errors.bio} />
          </section>

          <section id="practice" className="block">
            <div className="block-head"><Eyebrow>Your practice</Eyebrow></div>
            <Field label="Practice name" name="practice_name" defaultValue={profile.practiceName ?? ""} autoComplete="organization" error={state.errors.practice_name} />
            <div className="form-row">
              <Select label="Region" name="region" options={REGIONS.map((r) => ({ value: r, label: r }))} placeholder="Choose a region" defaultValue={profile.region ?? ""} error={state.errors.region} />
              <Select label="Practice type" name="practice_type" options={PRACTICE_TYPES.map((t) => ({ value: t, label: t }))} placeholder="Choose a type" defaultValue={profile.practiceType ?? ""} error={state.errors.practice_type} />
            </div>
            <div className="form-row">
              <Field label="Chairs" name="chair_count" type="number" min={1} max={60} inputMode="numeric" defaultValue={profile.chairCount ?? ""} error={state.errors.chair_count} />
              <Select label="Years as a principal" name="years_as_principal" options={YEARS_AS_PRINCIPAL} placeholder="Choose" defaultValue={yearsBand(profile.yearsAsPrincipal)} error={state.errors.years_as_principal} />
            </div>
          </section>

          <section id="club" className="block">
            <div className="block-head"><Eyebrow>In the Club</Eyebrow></div>
            <CheckboxGroup label="What you are working on" name="focus" options={FOCUS_AREAS} defaultValue={profile.focusAreas} error={state.errors.focus} help="Used to seat you with principals of fitting ambition." />
            <div className="form-row">
              <Select label="How often you would sit" name="cadence" options={CADENCES} defaultValue={profile.cadence} error={state.errors.cadence} />
            </div>
            <CheckboxGroup label="When suits you" name="times" options={TIMES} defaultValue={profile.preferredTimes} columns={3} error={state.errors.times} />
            <label className="check" htmlFor="nudge_opt_out">
              <input id="nudge_opt_out" type="checkbox" name="nudge_opt_out" defaultChecked={profile.nudgeOptOut} />
              <span>Do not send me the Monday reminder</span>
            </label>
          </section>

          {profile.role === "mentor" && (
            <section id="mentoring" className="block">
              <div className="block-head"><Eyebrow>Mentoring</Eyebrow></div>
              <div className="form-row">
                <Select label="How many mentees you will take" name="mentor_capacity" options={CAPACITIES} placeholder="Choose" defaultValue={profile.mentorCapacity ?? ""} error={state.errors.mentor_capacity} />
              </div>
              <TextArea label="A note for your mentees" name="mentor_note" defaultValue={profile.mentorNote ?? ""} rows={3} maxLength={400} help="Shown to mentees before they are seated with you." error={state.errors.mentor_note} />
            </section>
          )}

          <div className="form-actions">
            <SubmitButton>Save</SubmitButton>
          </div>
        </>
      )}
    </Form>
  );
}
