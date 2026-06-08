import type { Metadata } from "next";
import { requireUserProfile, surnameAddress } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActivePartnership } from "@/lib/data";
import { updateParticulars, endPartnership } from "@/lib/actions/settings";
import { FOCUS_AREAS, HONORIFICS, TIMES, TIMEZONES } from "@/lib/options";
import {
  Body,
  Button,
  Card,
  Caption,
  Divider,
  Eyebrow,
  Field,
  H1,
  H3,
  TextArea,
} from "@/components/ui";
import { CADENCE_LABEL } from "@/lib/cadence";
import { isPreviewMode } from "@/lib/preview";
import { demoPreferences } from "@/lib/demo";
import type { MatchPreference } from "@/lib/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile } = await requireUserProfile();
  const preview = await isPreviewMode();

  let prefs: MatchPreference | null = null;
  if (preview) {
    prefs = demoPreferences;
  } else {
    const supabase = await createClient();
    const { data: prefRow } = await supabase
      .from("match_preferences")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle();
    prefs = prefRow as MatchPreference | null;
  }
  const partnership = await getActivePartnership(profile.id);

  const focus = prefs?.focus_areas ?? [];
  const times = prefs?.preferred_times ?? [];

  return (
    <div className="section fade-enter" style={{ maxWidth: 760 }}>
      <Eyebrow>Your account · No. {profile.membership_no ?? "————"}</Eyebrow>
      <H1>Settings.</H1>
      <Body className="muted">Revise your particulars, your focus, and your standing.</Body>

      <Divider />

      <form action={updateParticulars} className="stack gap-6">
        <Eyebrow>Particulars</Eyebrow>
        <div className="grid-even">
          <div className="field">
            <label htmlFor="honorific">Honorific</label>
            <select id="honorific" name="honorific" defaultValue={profile.honorific ?? "Dr"}>
              {HONORIFICS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <Field label="Full name" name="full_name" defaultValue={profile.full_name ?? ""} required />
        </div>
        <div className="grid-even">
          <Field label="Practice" name="practice_name" defaultValue={profile.practice_name ?? ""} />
          <Field label="Location" name="location" defaultValue={profile.location ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="timezone">Time zone</label>
          <select id="timezone" name="timezone" defaultValue={profile.timezone ?? "Europe/London"}>
            {TIMEZONES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <TextArea label="A short note on your practice" name="bio" defaultValue={profile.bio ?? ""} />

        <Divider glyph="—" tight />

        <Eyebrow>Matching preferences</Eyebrow>
        <div className="field">
          <label>Your focus this season</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginTop: 8,
            }}
          >
            {FOCUS_AREAS.map((f) => (
              <label
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  font: "400 15px/1.3 var(--font-sans)",
                  color: "var(--fg-on-paper)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  name="focus"
                  value={f}
                  defaultChecked={focus.includes(f)}
                  style={{ width: "auto" }}
                />
                {f}
              </label>
            ))}
          </div>
        </div>
        <div className="grid-even">
          <div className="field">
            <label htmlFor="cadence">Cadence</label>
            <select id="cadence" name="cadence" defaultValue={prefs?.cadence ?? "monthly"}>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="field">
            <label>When you can meet</label>
            <div style={{ display: "flex", gap: 18, marginTop: 8, flexWrap: "wrap" }}>
              {TIMES.map((t) => (
                <label
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    font: "400 15px/1 var(--font-sans)",
                    color: "var(--fg-on-paper)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    name="times"
                    value={t}
                    defaultChecked={times.includes(t)}
                    style={{ width: "auto" }}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
        </div>
        <Field
          label="Interests, in your own words"
          name="interests"
          defaultValue={(prefs?.interests ?? []).join(", ")}
        />

        <div className="row">
          <Button type="submit">Save particulars</Button>
        </div>
      </form>

      <Divider />

      <div className="grid-even">
        <Card>
          <Eyebrow>Your partnership</Eyebrow>
          {partnership ? (
            <>
              <H3 style={{ fontSize: 20 }}>Paired with {surnameAddress(partnership.partner)}</H3>
              <Caption>
                {CADENCE_LABEL[partnership.cadence]} cadence. Ending a partnership returns you both
                to the queue.
              </Caption>
              <form action={endPartnership.bind(null, partnership.id)}>
                <Button type="submit" variant="ghost">
                  End this partnership
                </Button>
              </form>
            </>
          ) : (
            <Caption>You are not presently paired.</Caption>
          )}
        </Card>

        <Card>
          <Eyebrow>Session</Eyebrow>
          <H3 style={{ fontSize: 20 }}>Leave the House</H3>
          <Caption>You may sign in again at any time.</Caption>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="secondary" size="sm">
              Sign out
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
