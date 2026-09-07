"use client";

import { startTransition, useActionState, useEffect } from "react";
import { markThreadRead } from "@/lib/actions/messages";
import { EMPTY_STATE } from "@/lib/actions/state";

/**
 * Marks a thread read the moment it is on screen. Renders nothing, and runs
 * only when something is actually unread, so a quiet thread costs no write.
 */
export function MarkRead({ withId, unread }: { withId: string; unread: number }) {
  const [, act] = useActionState(markThreadRead, EMPTY_STATE);

  useEffect(() => {
    if (unread === 0) return;
    const fd = new FormData();
    fd.set("with_id", withId);
    startTransition(() => act(fd));
  }, [withId, unread, act]);

  return null;
}
