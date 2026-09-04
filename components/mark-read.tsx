"use client";

import { startTransition, useActionState, useEffect } from "react";
import { markThreadRead } from "@/lib/actions/messages";
import type { ActionState } from "@/lib/actions/define";

const INITIAL: ActionState = { ok: false, message: null, errors: {} };

/**
 * Marks a thread read the moment it is on screen. Renders nothing; runs the
 * action once per circle, and only when there is something unread, so a quiet
 * thread costs no write.
 */
export function MarkRead({ circleId, unread }: { circleId: string; unread: number }) {
  const [, act] = useActionState(markThreadRead, INITIAL);

  useEffect(() => {
    if (unread === 0) return;
    const fd = new FormData();
    fd.set("circle_id", circleId);
    startTransition(() => act(fd));
  }, [circleId, unread, act]);

  return null;
}
