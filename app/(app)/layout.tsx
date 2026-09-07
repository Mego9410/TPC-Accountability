import { requireViewer } from "@/lib/session";
import { initials } from "@/lib/domain";
import { TopNav, BottomNav } from "@/components/shell/nav";
import { navFor } from "@/components/shell/nav-items";
import { Footer, TourBar } from "@/components/shell/chrome";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const { profile, repo, userId } = viewer;
  const unread = await repo.countUnread(userId);
  const items = navFor(profile.role);

  return (
    <div className="tpc-frame">
      {viewer.isTour && viewer.persona && <TourBar persona={viewer.persona} />}
      <TopNav items={items} membershipNo={profile.membershipNo} initials={initials(profile.fullName)} unread={unread} />
      <main className="tpc-page" id="main">{children}</main>
      <Footer signedIn />
      <BottomNav items={items} />
    </div>
  );
}
