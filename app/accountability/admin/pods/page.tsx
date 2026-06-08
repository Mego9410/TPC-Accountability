import type { Metadata } from "next";
import { requireUserProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { Badge, Body, Button, Card, Caption, Divider, Eyebrow, H1, H3 } from "@/components/ui";
import { CreatePodForm } from "@/components/accountability/create-pod-form";
import { assignPodMember, removePodMember, setPodStatus } from "@/lib/actions/pods";
import type { Pod, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Admin · Pods" };

type ActiveMember = { pod_id: string; user_id: string; role: string };

export default async function AdminPodsPage() {
  const { profile } = await requireUserProfile();
  if (profile.role !== "house") {
    return (
      <div className="section fade-enter">
        <Eyebrow>Restricted</Eyebrow>
        <H1>Administrators only.</H1>
        <Body className="muted">This area is reserved for Club staff.</Body>
      </div>
    );
  }

  const svc = createServiceClient();
  const [{ data: podRows }, { data: memberRows }, { data: profileRows }] = await Promise.all([
    svc.from("pods").select("*").order("created_at", { ascending: false }),
    svc.from("pod_members").select("pod_id, user_id, role").is("left_at", null),
    svc.from("profiles").select("id, full_name, membership_no").order("full_name"),
  ]);

  const pods = (podRows ?? []) as Pod[];
  const members = (memberRows ?? []) as ActiveMember[];
  const profiles = (profileRows ?? []) as Pick<Profile, "id" | "full_name" | "membership_no">[];
  const nameById = new Map(profiles.map((p) => [p.id, p.full_name || `No. ${p.membership_no ?? "—"}`]));

  return (
    <div className="section fade-enter">
      <Eyebrow>Pod administration</Eyebrow>
      <H1>Pods.</H1>
      <Body className="muted" style={{ maxWidth: 620 }}>
        Form pods of four to six principals. A pod is far harder to relocate to a
        side-channel than a pair — and survives any one member going quiet.
      </Body>

      <Divider />

      <Card emphasis>
        <Eyebrow>New pod</Eyebrow>
        <div style={{ marginTop: 12 }}>
          <CreatePodForm />
        </div>
      </Card>

      <div className="stack gap-6" style={{ marginTop: 28 }}>
        {pods.length === 0 ? (
          <Caption>No pods yet.</Caption>
        ) : (
          pods.map((pod) => {
            const podMembers = members.filter((m) => m.pod_id === pod.id);
            const size = podMembers.length;
            const sizeOk = size >= 4 && size <= 6;
            const assigned = new Set(podMembers.map((m) => m.user_id));
            const assignable = profiles.filter((p) => !assigned.has(p.id));
            return (
              <Card key={pod.id}>
                <div className="row between" style={{ alignItems: "flex-start" }}>
                  <div>
                    <H3>{pod.name}</H3>
                    <Caption>
                      {pod.cohort_label ?? "No cohort"} · {size}{" "}
                      {size === 1 ? "member" : "members"}
                      {sizeOk ? "" : " · aim for 4–6"}
                    </Caption>
                  </div>
                  <Badge variant={pod.status === "active" ? "gold" : ""}>{pod.status}</Badge>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: "12px 0", display: "grid", gap: 8 }}>
                  {podMembers.map((m) => (
                    <li key={m.user_id} className="row between">
                      <Caption>
                        {nameById.get(m.user_id) ?? m.user_id}
                        {m.role === "lead" ? " · lead" : ""}
                      </Caption>
                      <form action={removePodMember}>
                        <input type="hidden" name="pod_id" value={pod.id} />
                        <input type="hidden" name="user_id" value={m.user_id} />
                        <Button type="submit" size="sm" variant="ghost">
                          Remove
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>

                {assignable.length > 0 && (
                  <form action={assignPodMember} className="row gap-4" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
                    <input type="hidden" name="pod_id" value={pod.id} />
                    <div className="field" style={{ minWidth: 220 }}>
                      <label htmlFor={`assign-${pod.id}`}>Add member</label>
                      <select id={`assign-${pod.id}`} name="user_id" defaultValue="">
                        <option value="" disabled>
                          Choose a principal…
                        </option>
                        {assignable.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name || `No. ${p.membership_no ?? "—"}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field" style={{ width: 130 }}>
                      <label htmlFor={`role-${pod.id}`}>Role</label>
                      <select id={`role-${pod.id}`} name="role" defaultValue="member">
                        <option value="member">Member</option>
                        <option value="lead">Lead</option>
                      </select>
                    </div>
                    <Button type="submit" size="sm" variant="secondary">
                      Assign
                    </Button>
                  </form>
                )}

                <div className="row gap-4" style={{ marginTop: 12 }}>
                  <form action={setPodStatus}>
                    <input type="hidden" name="pod_id" value={pod.id} />
                    <input type="hidden" name="status" value={pod.status === "active" ? "archived" : "active"} />
                    <Button type="submit" size="sm" variant="ghost">
                      {pod.status === "active" ? "Archive pod" : "Reactivate"}
                    </Button>
                  </form>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
