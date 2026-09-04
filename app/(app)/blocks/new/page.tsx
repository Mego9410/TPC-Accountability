import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { addWeeks, format, startOfWeek } from "date-fns";
import { requireViewer, canSeeSociety } from "@/lib/session";
import { PageHeader, TextLink } from "@/components/ui";
import { NewBlockForm } from "./new-block-form";

export const metadata: Metadata = { title: "Start a block" };

function nextMonday(): string {
  return format(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export default async function NewBlockPage() {
  const { profile, repo, userId } = await requireViewer();
  if (!canSeeSociety(profile)) redirect("/upgrade");

  const [templates, blocks] = await Promise.all([repo.listTemplates(), repo.listBlocks(userId)]);
  const active = blocks.find((b) => b.status === "active") ?? null;

  return (
    <div className="section fade-enter">
      <TextLink href="/blocks" back>All blocks</TextLink>
      <PageHeader
        eyebrow="The Society"
        title="Start a block"
        lede="Twelve weeks on one outcome. Choose a template and the weekly commitments are set down for you; or write your own and add them as you go."
      />
      <NewBlockForm templates={templates} activeTitle={active?.title ?? null} defaultStart={nextMonday()} />
    </div>
  );
}
