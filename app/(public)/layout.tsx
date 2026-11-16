import "@/components/landing/home.css";
import "./public.css";

/**
 * The public side of the Club: the home page, the morning, membership, the
 * documents, the tour, and the door itself.
 *
 * The layout is deliberately thin. The home page and the introduction form
 * are full-bleed designs that bring their own chrome, and the document pages
 * reach for `PublicShell` instead, so a shared header here would only have
 * to be undone twice.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
