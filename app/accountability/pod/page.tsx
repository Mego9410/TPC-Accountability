import type { Metadata } from "next";
import { format } from "date-fns";
import { requireUserProfile, initials } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isPreviewMode } from "@/lib/preview";
import { demoProfile } from "@/lib/demo";
import {
  demoPod,
  demoPodFeed,
  demoPodMembers,
  demoPodProfiles,
} from "@/lib/accountability-demo";
import { Body, Card, Caption, Divider, Eyebrow, H1, H3 } from "@/components/ui";
import { currentWeekKey, isoWeekKey } from "@/lib/accountability";
import type { CheckIn, Pod, PodMember, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Your pod" };

type PodProfile = Pick<Profile, "id" | "full_name" | "membership_no" | "practice_name">;

export default async function PodPage() {
  const { userId } = await requireUserProfile();
  const preview = await isPreviewMode();

  let pod: Pod | null;
  let members: Pick<PodMember, "user_id" | "role">[];
  let feed: CheckIn[];
  let profiles: PodProfile[];

  if (preview) {
    pod = demoPod;
    members = demoPodMembers;
    feed = demoPodFeed;
    profiles = [demoProfile, ...demoPodProfiles].map((p) => ({
      id: p.id,
      full_name: p.full_name,
      membership_no: p.membership_no,
      practice_name: p.practice_name,
    }));
  } else {
    const supabase = await createClient();

    const { data: myMembership } = await supabase
      .from("pod_members")
      .select("pod_id")
      .eq("user_id", userId)
      .is("left_at", null)
      .limit(1)
      .maybeSingle();

    if (!myMembership?.pod_id) {
      return (
        <div className="section fade-enter">
          <Eyebrow>Your pod</Eyebrow>
          <H1>You&rsquo;re not in a pod yet.</H1>
          <Body className="muted" style={{ maxWidth: 620 }}>
            Pods are small groups of four to six principals who keep each other to
            their word. The Club will place you in one shortly — you&rsquo;ll see
            your podmates and their weekly check-ins here.
          </Body>
        </div>
      );
    }

    const podId = myMembership.pod_id as string;

    const [{ data: podRow }, { data: memberRows }, { data: feedRows }] = await Promise.all([
      supabase.from("pods").select("*").eq("id", podId).maybeSingle(),
      supabase.from("pod_members").select("user_id, role").eq("pod_id", podId).is("left_at", null),
      supabase
        .from("check_ins")
        .select("*")
        .eq("pod_id", podId)
        .order("completed_at", { ascending: false })
        .limit(24),
    ]);

    pod = podRow as Pod | null;
    members = (memberRows ?? []) as Pick<PodMember, "user_id" | "role">[];
    feed = (feedRows ?? []) as CheckIn[];

    const ids = members.map((m) => m.user_id);
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, full_name, membership_no, practice_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    profiles = (profileRows ?? []) as PodProfile[];
  }

  const byId = new Map(profiles.map((p) => [p.id, p]));
  const nameOf = (id: string) => byId.get(id)?.full_name || `No. ${byId.get(id)?.membership_no ?? "—"}`;

  const thisWeek = currentWeekKey();

  return (
    <div className="section fade-enter">
      <Eyebrow>Your pod{pod?.cohort_label ? ` · ${pod.cohort_label}` : ""}</Eyebrow>
      <H1>{pod?.name ?? "Your pod"}</H1>
      <Body className="muted" style={{ maxWidth: 620 }}>
        The group is the habit. Here is who you keep company with, and what they
        committed to this week.
      </Body>

      <Divider />

      <div className="grid-2">
        <div className="stack gap-4">
          <Eyebrow>Podmates ({members.length})</Eyebrow>
          {members.map((m) => (
            <Card key={m.user_id}>
              <div className="partner-card">
                <div className="pc-avatar">{initials(byId.get(m.user_id)?.full_name)}</div>
                <div>
                  <H3>
                    {nameOf(m.user_id)}
                    {m.user_id === userId ? " · you" : ""}
                    {m.role === "lead" ? " · lead" : ""}
                  </H3>
                  <Caption>{byId.get(m.user_id)?.practice_name ?? "Principal dentist"}</Caption>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="stack gap-4">
          <Eyebrow>The week&rsquo;s check-ins</Eyebrow>
          {feed.length === 0 ? (
            <Card>
              <Caption>No check-ins shared yet. Be the first this week.</Caption>
            </Card>
          ) : (
            feed.map((c) => {
              const current = isoWeekKey(new Date(c.completed_at)) === thisWeek;
              return (
                <Card key={c.id} emphasis={current}>
                  <div className="row between">
                    <H3>{nameOf(c.user_id)}</H3>
                    <Caption>
                      {format(new Date(c.completed_at), "d MMM")}
                      {c.energy_score ? ` · energy ${c.energy_score}/10` : ""}
                    </Caption>
                  </div>
                  {c.did_well && (
                    <Caption style={{ marginTop: 6 }}>
                      <strong>Went well:</strong> {c.did_well}
                    </Caption>
                  )}
                  {c.next_week_focus && (
                    <Caption style={{ marginTop: 4 }}>
                      <strong>Focus:</strong> {c.next_week_focus}
                    </Caption>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
