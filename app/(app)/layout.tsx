import { requireViewer } from "@/lib/session";
import { VISITS_A_YEAR, visitsThisYear } from "@/lib/domain";
import { LedgerNav } from "@/components/shell/ledger-nav";
import { navFor } from "@/components/shell/nav-items";
import { TourBar } from "@/components/shell/chrome";

/**
 * The members' side: the rail, and the work.
 *
 * The rail carries the membership card, so the layout counts this year's
 * mornings here rather than making every page do it.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const { profile, repo, userId } = viewer;
  const [unread, visits] = await Promise.all([repo.countUnread(userId), repo.listVisitsFor(userId)]);
  const items = navFor(profile.role);

  return (
    <div className="tpc-frame">
      <LedgerNav
        items={items}
        membershipNo={profile.membershipNo}
        unread={unread}
        visitsUsed={visitsThisYear(visits, userId)}
        visitsAllowed={VISITS_A_YEAR}
      />
      <div className="tpc-col">
        {viewer.isTour && viewer.persona && <TourBar persona={viewer.persona} />}
        <main className="tpc-page" id="main">{children}</main>
      </div>
    </div>
  );
}
