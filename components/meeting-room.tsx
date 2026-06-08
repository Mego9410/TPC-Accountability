"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureMeetingRoom, completeMeeting } from "@/lib/actions/meetings";
import { Button } from "@/components/ui";

export function MeetingRoom({
  meetingId,
  initialRoomUrl,
  status,
  demo,
}: {
  meetingId: string;
  initialRoomUrl: string | null;
  status: string;
  demo?: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(initialRoomUrl);
  const [joined, setJoined] = useState(false);
  const [stub, setStub] = useState(false);
  const [pending, startTransition] = useTransition();

  function join() {
    if (demo) {
      setStub(true);
      return;
    }
    startTransition(async () => {
      const res = await ensureMeetingRoom(meetingId);
      if (res.url) {
        setUrl(res.url);
        setJoined(true);
      } else {
        setStub(res.stub);
      }
    });
  }

  function conclude() {
    if (demo) return;
    startTransition(async () => {
      await completeMeeting(meetingId);
      router.refresh();
    });
  }

  return (
    <div className="stack gap-5">
      <div className="video-stage">
        {joined && url ? (
          <iframe
            src={url}
            title="The sitting"
            allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
          />
        ) : (
          <div className="placeholder stack gap-4" style={{ alignItems: "center" }}>
            {stub ? (
              <>
                <div className="eyebrow on-dark">Video not yet connected</div>
                <p className="body" style={{ color: "var(--fg-muted)" }}>
                  Add a <b>DAILY_API_KEY</b> to hold the sitting within the Club. The
                  rest of the appointment — notes, transcript, and goals — works without it.
                </p>
                <div className="mono-sm">room · tpc-{meetingId.slice(0, 8)}</div>
              </>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/monogram.svg" alt="" style={{ height: 56, opacity: 0.7 }} />
                <p className="body" style={{ color: "var(--fg-muted)" }}>
                  The room is ready when you are.
                </p>
                <Button onClick={join} disabled={pending} onDark variant="secondary">
                  {pending ? "Opening the room" : "Enter the room"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="row between wrap">
        <span className="caption">
          {status === "completed"
            ? "This sitting is concluded."
            : "When you have finished, conclude the sitting to hold the next."}
        </span>
        {status !== "completed" && (
          <Button variant="ghost" onClick={conclude} disabled={pending}>
            Conclude the sitting
          </Button>
        )}
      </div>
    </div>
  );
}
