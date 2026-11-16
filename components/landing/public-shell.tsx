import { getViewer } from "@/lib/session";
import { SiteFooter, SiteHeader } from "./chrome";

/**
 * The document pages — the morning, membership, the house rules, privacy,
 * the tour — wrapped in the same head and foot as the home page.
 *
 * `.h` carries the chrome's styling and a dark ground; the page's own
 * sections paint over it, which is why `.lp-section.paper` and friends set
 * their colour explicitly in public.css.
 */
export async function PublicShell({
  children,
  pad = true,
}: {
  children: React.ReactNode;
  pad?: boolean;
}) {
  const viewer = await getViewer();
  const signedIn = viewer !== null;

  return (
    <div className="h lp-doc-shell">
      <SiteHeader signedIn={signedIn} />
      <main id="main" className="lp-main" style={pad ? { paddingTop: 88 } : undefined}>
        {children}
      </main>
      <SiteFooter signedIn={signedIn} />
    </div>
  );
}
