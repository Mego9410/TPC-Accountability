import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { MEMBER_ROLE_LABEL, TIER_LABEL, type MemberRole, type Tier } from "@/lib/domain";
import { setMemberRole } from "@/lib/actions/house";
import { SubNav } from "@/components/shell/nav";
import { Caption, EmptyState, PageHeader, Person, Select } from "@/components/ui";
import { Form, SubmitButton } from "@/components/ui/form";
import { HOUSE_NAV } from "@/lib/house";

export const metadata: Metadata = { title: "Members" };

const ROLE_OPTIONS = (Object.keys(MEMBER_ROLE_LABEL) as MemberRole[]).map((r) => ({ value: r, label: MEMBER_ROLE_LABEL[r] }));
const TIER_OPTIONS = (Object.keys(TIER_LABEL) as Tier[]).map((t) => ({ value: t, label: TIER_LABEL[t] }));

export default async function HouseMembersPage() {
  const { repo } = await requireViewer({ roles: ["staff"] });
  const [members, circles] = await Promise.all([repo.listAllProfiles(), repo.listAllCircles()]);
  const sorted = [...members].sort((a, b) => a.fullName.localeCompare(b.fullName));
  const seatsOf = (userId: string) =>
    circles.filter((c) => c.status === "active" && c.members.some((m) => m.userId === userId)).map((c) => c.name);

  return (
    <div className="section fade-enter">
      <SubNav items={HOUSE_NAV} />
      <PageHeader eyebrow="The House" title="Members" lede={`${members.length} principals on the books. Change a member's standing from the row.`} />

      {sorted.length === 0 ? (
        <EmptyState title="No members yet.">Principals appear here once they have finished their introduction.</EmptyState>
      ) : (
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Principal</th>
                <th scope="col">Practice</th>
                <th scope="col">Region</th>
                <th scope="col">Role</th>
                <th scope="col">Standing</th>
                <th scope="col" className="num">Consistency</th>
                <th scope="col">Seated in</th>
                <th scope="col"><span className="sr-only">Change standing</span></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => {
                const seats = seatsOf(m.id);
                return (
                  <tr key={m.id}>
                    <td><Person name={m.fullName} meta={`No. ${m.membershipNo}`} size="sm" /></td>
                    <td className="wrapcell">{m.practiceName ?? <span className="muted">—</span>}</td>
                    <td>{m.region ?? <span className="muted">—</span>}</td>
                    <td>{MEMBER_ROLE_LABEL[m.role]}</td>
                    <td>{TIER_LABEL[m.tier]}</td>
                    <td className="num">{m.consistencyScore}</td>
                    <td className="wrapcell">{seats.length > 0 ? seats.join(", ") : <span className="muted">Waiting for a seat</span>}</td>
                    <td>
                      <details className="disclosure">
                        <summary>Change</summary>
                        <div className="disclosure-body">
                          <Form action={setMemberRole} className="compact">
                            <input type="hidden" name="user_id" value={m.id} />
                            <Select label="Role" name="role" options={ROLE_OPTIONS} defaultValue={m.role} />
                            <Select label="Standing" name="tier" options={TIER_OPTIONS} defaultValue={m.tier} />
                            <SubmitButton size="sm" variant="secondary">Save</SubmitButton>
                          </Form>
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Caption>Consistency is each member&rsquo;s own figure and is not shown to other members. Making someone a mentor lets the House seat mentees with them.</Caption>
    </div>
  );
}
