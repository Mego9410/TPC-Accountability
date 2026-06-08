import Link from "next/link";
import type { Metadata } from "next";
import { requireUserProfile, surnameAddress } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActivePartnership, getUpcomingMeetings } from "@/lib/data";
import { disconnectCalendar } from "@/lib/actions/calendar";
import { scheduleMeeting } from "@/lib/actions/meetings";
import { env } from "@/lib/env";
import { isPreviewMode } from "@/lib/preview";
import { Badge, Body, Button, Card, Caption, Divider, Eyebrow, H1, H3 } from "@/components/ui";
import { CADENCE_LABEL, formatAppointment } from "@/lib/cadence";
import type { CalendarConnection, Meeting } from "@/lib/types";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const { userId } = await requireUserProfile();
  const preview = await isPreviewMode();
  const partnership = await getActivePartnership(userId);

  let connections: CalendarConnection[] = [];
  if (!preview) {
    const supabase = await createClient();
    const { data: conns } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("user_id", userId);
    connections = (conns as CalendarConnection[]) ?? [];
  }

  const meetings = partnership ? await getUpcomingMeetings(partnership.id) : [];
  const upcoming = meetings.filter(
    (m) => m.status === "scheduled" && new Date(m.scheduled_at) >= new Date(Date.now() - 864e5),
  );

  return (
    <div className="section fade-enter">
      <Eyebrow>Appointments</Eyebrow>
      <H1>The calendar.</H1>
      <Body className="muted" style={{ maxWidth: 640 }}>
        Your sittings, held in the Club and, if you wish, in your own calendar.
      </Body>

      <Divider />

      {/* ---- Calendar connections ---- */}
      <div className="stack gap-4">
        <Eyebrow>Your calendars</Eyebrow>
        <div className="grid-even">
          <CalendarConnect
            provider="google"
            label="Google Calendar"
            configured={env.google.isConfigured}
            connection={connections.find((c) => c.provider === "google")}
          />
          <CalendarConnect
            provider="microsoft"
            label="Outlook Calendar"
            configured={env.microsoft.isConfigured}
            connection={connections.find((c) => c.provider === "microsoft")}
          />
        </div>
      </div>

      <Divider />

      {!partnership ? (
        <div className="notice" style={{ maxWidth: 560 }}>
          Sittings are arranged once you are matched with a partner.
        </div>
      ) : (
        <div className="grid-cal">
          <MonthGrid meetings={upcoming} />

          <div className="stack gap-6">
            <Card>
              <Eyebrow>Arrange a sitting</Eyebrow>
              <H3 style={{ fontSize: 20 }}>A standing appointment.</H3>
              <Caption>
                With {surnameAddress(partnership.partner)} · {CADENCE_LABEL[partnership.cadence]} cadence
              </Caption>
              <form action={scheduleMeeting} className="stack gap-4" style={{ marginTop: 8 }}>
                <input type="hidden" name="partnership_id" value={partnership.id} />
                <input type="hidden" name="cadence" value={partnership.cadence} />
                <div className="field">
                  <label htmlFor="scheduled_at">Date and time</label>
                  <input id="scheduled_at" name="scheduled_at" type="datetime-local" required />
                </div>
                <div className="row">
                  <Button type="submit" size="sm">
                    Hold the appointment
                  </Button>
                </div>
              </form>
            </Card>

            <div className="stack gap-4">
              <Eyebrow>Upcoming sittings</Eyebrow>
              {upcoming.length === 0 ? (
                <Caption>No sittings presently held.</Caption>
              ) : (
                <div className="hairline-list">
                  {upcoming.map((m) => (
                    <Link key={m.id} href={`/meetings/${m.id}`} className="row">
                      <div className="date">{formatAppointment(m.scheduled_at)}</div>
                      <div>
                        <div className="title" style={{ fontSize: 18 }}>
                          A sitting with {surnameAddress(partnership.partner)}
                        </div>
                        <div className="meta">
                          {CADENCE_LABEL[m.cadence]} cadence
                          {m.google_event_id ? " · in Google" : ""}
                          {m.microsoft_event_id ? " · in Outlook" : ""}
                        </div>
                      </div>
                      <div className="right">
                        <Badge variant="gold">Held</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarConnect({
  provider,
  label,
  configured,
  connection,
}: {
  provider: "google" | "microsoft";
  label: string;
  configured: boolean;
  connection?: CalendarConnection;
}) {
  return (
    <Card>
      <div className="row between">
        <H3 style={{ fontSize: 20 }}>{label}</H3>
        {connection ? (
          <Badge variant="confirmed">Connected</Badge>
        ) : (
          <Badge variant="gold">Not linked</Badge>
        )}
      </div>
      {connection ? (
        <>
          <Caption>{connection.account_email ?? "Connected account"}</Caption>
          <form action={disconnectCalendar.bind(null, provider)}>
            <Button type="submit" variant="ghost">
              Disconnect
            </Button>
          </form>
        </>
      ) : configured ? (
        <>
          <Caption>Hold your sittings in {label} automatically.</Caption>
          <div className="row">
            <Button href={`/api/calendar/${provider}`} variant="secondary" size="sm">
              Connect
            </Button>
          </div>
        </>
      ) : (
        <Caption>
          Add the {provider === "google" ? "GOOGLE" : "MICROSOFT"} client credentials to enable
          this connection.
        </Caption>
      )}
    </Card>
  );
}

function MonthGrid({ meetings }: { meetings: Meeting[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventDays = new Map<number, string>();
  for (const m of meetings) {
    const d = new Date(m.scheduled_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      eventDays.set(
        d.getDate(),
        d
          .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
          .replace(/\s?([ap])m/i, (_x, p) => `${p}m`),
      );
    }
  }

  const heads = ["S", "M", "T", "W", "T", "F", "S"];
  const cells: Array<{ n: number | null }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ n: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ n: d });
  while (cells.length % 7 !== 0) cells.push({ n: null });

  return (
    <div className="stack gap-4">
      <Eyebrow>{monthLabel}</Eyebrow>
      <div className="cal">
        {heads.map((h, i) => (
          <div key={`h${i}`} className="head">
            {h}
          </div>
        ))}
        {cells.map((c, i) => {
          const ev = c.n ? eventDays.get(c.n) : undefined;
          const isToday = c.n === now.getDate();
          return (
            <div key={i} className={`day${c.n === null ? " muted" : ""}${ev ? " selected" : ""}`}>
              {c.n !== null && (
                <>
                  <div className="n" style={isToday && !ev ? { color: "var(--tpc-gold-deep)" } : undefined}>
                    {c.n}
                  </div>
                  {ev && <div className="ev">Sitting · {ev}</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
