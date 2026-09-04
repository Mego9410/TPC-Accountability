import type { Metadata } from "next";
import Link from "next/link";
import { requireViewer } from "@/lib/session";
import { firstName, othersIn, type CircleWithMembers, type Message } from "@/lib/domain";
import { circleTitle } from "@/lib/queries";
import { Avatar, Caption, EmptyState, PageHeader, Person, TextArea, TextLink, cn } from "@/components/ui";
import { Form, SubmitButton } from "@/components/ui/form";
import { sendMessage } from "@/lib/actions/messages";
import { MarkRead } from "@/components/mark-read";

export const metadata: Metadata = { title: "Correspondence" };

type Thread = { circle: CircleWithMembers; messages: Message[]; unread: number };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ circle?: string }> }) {
  const { repo, userId } = await requireViewer();
  const { circle: wanted } = await searchParams;
  const circles = (await repo.listCirclesFor(userId)).filter((c) => c.status === "active");

  if (circles.length === 0) {
    return (
      <div className="section fade-enter">
        <PageHeader eyebrow="Correspondence" title="The post." />
        <EmptyState title="No line is open yet." action={<TextLink href="/circle">Your circle</TextLink>}>
          A private line opens to your partner and your pod once the House has seated you.
        </EmptyState>
      </div>
    );
  }

  const threads: Thread[] = await Promise.all(
    circles.map(async (circle) => {
      const [messages, unread] = await Promise.all([repo.listMessages(circle.id), repo.countUnread([circle.id], userId)]);
      return { circle, messages, unread };
    }),
  );
  // Pairs first, then pods; within that, the most recently written first.
  threads.sort((a, b) => {
    if (a.circle.kind !== b.circle.kind) return a.circle.kind === "pair" ? -1 : 1;
    return (b.messages.at(-1)?.createdAt ?? "").localeCompare(a.messages.at(-1)?.createdAt ?? "");
  });

  const current =
    threads.find((t) => t.circle.id === wanted) ??
    threads.find((t) => t.unread > 0) ??
    threads.find((t) => t.circle.kind === "pair") ??
    threads[0];
  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <div className="section fade-enter">
      <PageHeader
        eyebrow="Correspondence"
        title="The post."
        lede={totalUnread > 0 ? `${totalUnread} unread ${totalUnread === 1 ? "note" : "notes"}.` : "Nothing waiting for you."}
      />

      <div className="grid-sidebar reverse">
        <nav className="thread-list" aria-label="Threads">
          {threads.map((t) => (
            <ThreadLink key={t.circle.id} thread={t} active={t.circle.id === current.circle.id} userId={userId} />
          ))}
        </nav>

        <ThreadView thread={current} userId={userId} />
      </div>
    </div>
  );
}

/* ---------- Thread list ---------- */

function ThreadLink({ thread, active, userId }: { thread: Thread; active: boolean; userId: string }) {
  const { circle, messages, unread } = thread;
  const title = circleTitle(circle, userId);
  const avatarName = circle.kind === "pair" ? (othersIn(circle, userId)[0]?.profile.fullName ?? circle.name) : circle.name;
  const last = messages.at(-1);
  const byId = new Map(circle.members.map((m) => [m.userId, m.profile]));
  const lastLine = last
    ? `${last.senderId === userId ? "You" : firstName(byId.get(last.senderId) ?? { fullName: "A member" })}: ${last.body}`
    : "No notes yet.";
  return (
    <Link href={`/messages?circle=${circle.id}`} className={cn(active && "active")} aria-current={active ? "page" : undefined}>
      <Avatar name={avatarName} size="md" />
      <span className="t-text">
        <span className="t-name">{title}</span>
        <span className="t-last">{lastLine}</span>
        <span className="t-meta">{circle.kind === "pair" ? "Your pair" : `Your pod · ${circle.members.length} principals`}</span>
      </span>
      {unread > 0 && <span className="t-unread" role="img" aria-label={`${unread} unread`} />}
    </Link>
  );
}

/* ---------- The thread ---------- */

function ThreadView({ thread, userId }: { thread: Thread; userId: string }) {
  const { circle, messages, unread } = thread;
  const byId = new Map(circle.members.map((m) => [m.userId, m.profile]));
  const other = othersIn(circle, userId)[0]?.profile ?? null;
  const title = circleTitle(circle, userId);
  const placeholder = circle.kind === "pair" && other ? `Write to ${firstName(other)}` : `Write to ${circle.name}`;
  const isPod = circle.kind === "pod";

  return (
    <section className="chat" aria-label={`Correspondence with ${title}`}>
      <MarkRead circleId={circle.id} unread={unread} />
      <div className="chat-head">
        <Person name={circle.kind === "pair" && other ? other.fullName : circle.name} size="sm" meta={isPod ? `${circle.members.length} principals` : (other?.practiceName ?? "Principal")} />
        <Caption>{unread > 0 ? `${unread} unread` : `${messages.length} ${messages.length === 1 ? "note" : "notes"}`}</Caption>
      </div>

      <div className="stream latest-first">
        {messages.length === 0 && (
          <div className="bubble system">A private line between sittings. Notes are seen only by the people in this circle.</div>
        )}
        {[...messages].reverse().map((m) => {
          const mine = m.senderId === userId;
          const who = byId.get(m.senderId)?.fullName ?? "A member";
          return (
            <div key={m.id} className={cn("bubble", mine ? "me" : "them")}>
              {isPod && !mine && <span className="who">{who}</span>}
              {m.body}
              <time className="when" dateTime={m.createdAt}>{shortWhen(m.createdAt)}</time>
            </div>
          );
        })}
        {messages.length > 0 && (
          <div className="bubble system">Seen only by the people in this circle.</div>
        )}
      </div>

      <Form action={sendMessage} resetOnSuccess successNotice={false} className="composer">
        {(state) => (
          <>
            <input type="hidden" name="circle_id" value={circle.id} />
            <TextArea label="Your note" name="body" hideLabel rows={2} placeholder={placeholder} required maxLength={2000} error={state.errors.body} />
            <SubmitButton size="sm" pendingText="Sending…">Send</SubmitButton>
          </>
        )}
      </Form>
    </section>
  );
}

function shortWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?([ap])m/i, (_m, p: string) => ` ${p.toLowerCase()}m`);
  return `${date} · ${time}`;
}
