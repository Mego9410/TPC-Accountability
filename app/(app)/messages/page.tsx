import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/lib/session";
import { address, firstName, practiceLine, type Message, type Profile } from "@/lib/domain";
import { sendMessage } from "@/lib/actions/messages";
import { Avatar, Button, Caption, EmptyState, PageHeader, Person, cn } from "@/components/ui";
import { FTextArea, Form, SubmitButton } from "@/components/ui/form";
import { MarkRead } from "./mark-read";

export const metadata: Metadata = { title: "Correspondence" };

type Thread = { other: Profile; messages: Message[]; unread: number };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const { repo, userId } = await requireViewer();
  const { with: wanted } = await searchParams;

  const all = await repo.listCorrespondents(userId);
  const byOther = new Map<string, Message[]>();
  for (const m of all) {
    const otherId = m.fromId === userId ? m.toId : m.fromId;
    const held = byOther.get(otherId);
    if (held) held.push(m);
    else byOther.set(otherId, [m]);
  }

  const ids = [...byOther.keys()];
  if (wanted && wanted !== userId && !byOther.has(wanted)) ids.push(wanted);
  const people = new Map<string, Profile>((await repo.listProfiles(ids)).map((p) => [p.id, p]));

  const threads: Thread[] = ids
    .map((id) => {
      const other = people.get(id);
      if (!other) return null;
      const messages = byOther.get(id) ?? [];
      return { other, messages, unread: messages.filter((m) => m.toId === userId && !m.readAt).length };
    })
    .filter((t): t is Thread => t !== null)
    .sort((a, b) => (b.messages.at(-1)?.createdAt ?? "9999").localeCompare(a.messages.at(-1)?.createdAt ?? "9999"));

  if (threads.length === 0) {
    return (
      <div className="section fade-enter">
        <PageHeader eyebrow="Correspondence" title="The post." />
        <EmptyState title="Nothing has been written yet." action={<Button href="/members">Look through the members</Button>}>
          A note between two principals, and nobody else. Write to your partner, or to anyone whose morning you are
          arranging.
        </EmptyState>
      </div>
    );
  }

  const current = threads.find((t) => t.other.id === wanted) ?? threads.find((t) => t.unread > 0) ?? threads[0];
  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Correspondence"
        title="The post."
        lede={
          totalUnread > 0
            ? `${totalUnread} unread ${totalUnread === 1 ? "note" : "notes"}.`
            : "Nothing waiting for you."
        }
      />

      <div className="grid-sidebar reverse">
        <nav className="thread-list" aria-label="Correspondents">
          {threads.map((t) => {
            const last = t.messages.at(-1);
            const active = t.other.id === current.other.id;
            return (
              <Link
                key={t.other.id}
                href={`/messages?with=${t.other.id}`}
                className={cn(active && "active")}
                aria-current={active ? "page" : undefined}
              >
                <Avatar name={t.other.fullName} size="md" />
                <span className="t-text">
                  <span className="t-name">{t.other.fullName}</span>
                  <span className="t-last">
                    {last ? `${last.fromId === userId ? "You" : firstName(t.other)}: ${last.body}` : "No notes yet."}
                  </span>
                  <span className="t-meta">{t.other.practiceName ?? "A member of the Club"}</span>
                </span>
                {t.unread > 0 && <span className="t-unread" role="img" aria-label={`${t.unread} unread`} />}
              </Link>
            );
          })}
        </nav>

        <ThreadView thread={current} userId={userId} />
      </div>
    </div>
  );
}

function ThreadView({ thread, userId }: { thread: Thread; userId: string }) {
  const { other, messages, unread } = thread;
  return (
    <section className="chat" aria-label={`Correspondence with ${other.fullName}`}>
      <MarkRead withId={other.id} unread={unread} />
      <div className="chat-head">
        <Person name={other.fullName} size="sm" meta={practiceLine(other) || "A member of the Club"} />
        <Caption>
          {unread > 0 ? `${unread} unread` : `${messages.length} ${messages.length === 1 ? "note" : "notes"}`}
        </Caption>
      </div>

      <div className="stream latest-first">
        {messages.length === 0 && (
          <div className="bubble system">Nothing written yet. A line is enough to start.</div>
        )}
        {[...messages].reverse().map((m) => (
          <div key={m.id} className={cn("bubble", m.fromId === userId ? "me" : "them")}>
            {m.body}
            <time className="when" dateTime={m.createdAt}>{shortWhen(m.createdAt)}</time>
          </div>
        ))}
        {messages.length > 0 && <div className="bubble system">Seen by the two of you and nobody else.</div>}
      </div>

      <Form action={sendMessage} resetOnSuccess successNotice={false} className="composer">
        <input type="hidden" name="to_id" value={other.id} />
        <FTextArea
          label={`Write to ${address(other)}`}
          name="body"
          hideLabel
          rows={2}
          required
          maxLength={2000}
          placeholder={`Write to ${firstName(other)}`}
        />
        <SubmitButton size="sm" pendingText="Sending…">Send</SubmitButton>
      </Form>
    </section>
  );
}

function shortWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const time = d
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?([ap])m/i, (_m, p: string) => ` ${p.toLowerCase()}m`);
  return `${date} · ${time}`;
}
