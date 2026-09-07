import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { partnerIdOf, practiceLine, type Profile } from "@/lib/domain";
import { Badge, Caption, EmptyState, PageHeader, Section } from "@/components/ui";

export const metadata: Metadata = { title: "The House" };

export default async function HousePage() {
  const { repo } = await requireViewer({ roles: ["staff"] });
  const members = await repo.listMembers();
  const byId = new Map<string, Profile>(members.map((m) => [m.id, m]));

  const partnerOf = new Map<string, Profile>();
  await Promise.all(
    members.map(async (m) => {
      const active = (await repo.listPartnerships(m.id)).find((p) => p.status === "active");
      if (!active) return;
      const other = byId.get(partnerIdOf(active, m.id));
      if (other) partnerOf.set(m.id, other);
    }),
  );

  const partnered = members.filter((m) => partnerOf.has(m.id)).length;

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="The House"
        title="Who is here, and who is with whom."
        lede="One page. The House keeps the register and nothing else."
      />

      <Section
        title={`${members.length} ${members.length === 1 ? "member" : "members"}`}
        aside={<Caption>{partnered} of them are partnered.</Caption>}
      >
        {members.length === 0 ? (
          <EmptyState title="No members yet.">The register is empty.</EmptyState>
        ) : (
          <div className="tablewrap">
            <table className="table">
              <caption className="sr-only">Members of the Club and their partners</caption>
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Practice</th>
                  <th scope="col">Partner</th>
                  <th scope="col">Open to</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const partner = partnerOf.get(m.id);
                  return (
                    <tr key={m.id}>
                      <td className="wrapcell">
                        {m.fullName}
                        <br />
                        <span className="mono-sm">No. {m.membershipNo}</span>
                      </td>
                      <td className="wrapcell">{practiceLine(m) || "Not given"}</td>
                      <td className="wrapcell">{partner ? partner.fullName : "None"}</td>
                      <td className="wrapcell">
                        <span className="badge-row start">
                          {m.openToPartner && <Badge tone="ok">A partner</Badge>}
                          {m.openToVisits && <Badge tone="gold">Visits</Badge>}
                          {!m.openToPartner && !m.openToVisits && <Badge tone="muted">Nothing at present</Badge>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
