import { requireViewer, canSeeSociety } from "@/lib/session";
import { initials } from "@/lib/domain";
import { TopNav, BottomNav, navFor } from "@/components/shell/nav";
import { Footer, TourBar } from "@/components/shell/chrome";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const { profile, repo, userId } = viewer;
  const circles = await repo.listCirclesFor(userId);
  const unread = await repo.countUnread(circles.map((c) => c.id), userId);
  const items = navFor(profile.role, canSeeSociety(profile));

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
