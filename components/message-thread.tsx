"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

export function MessageThread({
  partnershipId,
  userId,
  initialMessages,
  demo,
}: {
  partnershipId: string;
  userId: string;
  initialMessages: Message[];
  demo?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient());

  useEffect(() => {
    if (demo) return;
    const client = supabase.current;

    // Mark the partner's unread notes as read on open.
    client
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("partnership_id", partnershipId)
      .neq("sender_id", userId)
      .is("read_at", null)
      .then(() => {});

    const channel = client
      .channel(`messages:${partnershipId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `partnership_id=eq.${partnershipId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [partnershipId, userId, demo]);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");

    if (demo) {
      const local: Message = {
        id: `local-${Date.now()}`,
        partnership_id: partnershipId,
        sender_id: userId,
        body,
        read_at: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, local]);
      setSending(false);
      return;
    }

    const { data } = await supabase.current
      .from("messages")
      .insert({ partnership_id: partnershipId, sender_id: userId, body })
      .select("*")
      .single();
    if (data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message],
      );
    }
    setSending(false);
  }

  return (
    <div className="chat">
      <div className="stream" ref={streamRef}>
        {messages.length === 0 && (
          <p className="caption" style={{ margin: "auto" }}>
            Nothing for your attention. Begin the correspondence below.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`bubble ${mine ? "me" : "them"}`}>
              {m.body}
              <span className="when">{formatTime(m.created_at)}</span>
            </div>
          );
        })}
      </div>
      <div className="composer">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a note…"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          type="button"
          className="btn primary sm"
          onClick={send}
          disabled={sending || !draft.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?([ap])m/i, (_m, p) => ` ${p.toLowerCase()}m`);
}
