import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUserProfile } from "@/lib/auth";
import { saveOnboarding } from "@/lib/actions/onboarding";
import { Body, Button, Divider, Eyebrow, Field, H1, TextArea } from "@/components/ui";
import { FOCUS_AREAS, HONORIFICS, TIMES, TIMEZONES } from "@/lib/options";

export const metadata: Metadata = { title: "A few particulars" };

export default async function OnboardingPage() {
  const { profile } = await requireUserProfile();
  if (profile.onboarded) redirect("/dashboard");

  return (
    <div style={{ background: "var(--bg-paper)", minHeight: "100dvh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "28px 24px",
          borderBottom: "1px solid var(--rule-on-paper)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/monogram.svg" alt="The Principals Club" style={{ height: 40 }} />
      </div>

      <div
        className="fade-enter"
        style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px 120px" }}
      >
        <Eyebrow>You have been put forward</Eyebrow>
        <H1 style={{ marginTop: 12 }}>A few particulars.</H1>
        <Body className="muted" style={{ marginTop: 12 }}>
          The Club matches on ambition and on hour. Tell us your focus for the
          season and the cadence you can keep, and a partner will follow.
        </Body>

        <Divider />

        <form action={saveOnboarding} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
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
            <Field
              label="Full name"
              name="full_name"
              placeholder="Jordan Cheng"
              defaultValue={profile.full_name ?? ""}
              required
            />
          </div>

          <div className="grid-even">
            <Field
              label="Practice"
              name="practice_name"
              placeholder="Cheng Dental, Marylebone"
              defaultValue={profile.practice_name ?? ""}
            />
            <Field
              label="Location"
              name="location"
              placeholder="London"
              defaultValue={profile.location ?? ""}
            />
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

          <TextArea
            label="A short note on your practice"
            name="bio"
            placeholder="What you run, and what you are working towards."
            defaultValue={profile.bio ?? ""}
          />

          <Divider glyph="—" tight />

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
                    letterSpacing: 0,
                    textTransform: "none",
                    color: "var(--fg-on-paper)",
                    cursor: "pointer",
                  }}
                >
                  <input type="checkbox" name="focus" value={f} style={{ width: "auto" }} />
                  {f}
                </label>
              ))}
            </div>
          </div>

          <div className="grid-even">
            <div className="field">
              <label htmlFor="cadence">Cadence</label>
              <select id="cadence" name="cadence" defaultValue="monthly">
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
                      letterSpacing: 0,
                      textTransform: "none",
                      color: "var(--fg-on-paper)",
                      cursor: "pointer",
                    }}
                  >
                    <input type="checkbox" name="times" value={t} style={{ width: "auto" }} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Field
            label="Interests, in your own words"
            name="interests"
            placeholder="Implants, leadership, cycling — separated by commas"
            defaultValue=""
          />

          <div className="row" style={{ marginTop: 8 }}>
            <Button type="submit">Put me forward for matching</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
