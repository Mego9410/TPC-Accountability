"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addGoal } from "@/lib/actions/goals";
import { Button } from "@/components/ui";

export function AddGoalForm({
  partnershipId,
  demo,
}: {
  partnershipId: string;
  demo?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");

  function onSubmit(formData: FormData) {
    if (!title.trim()) return;
    if (demo) {
      formRef.current?.reset();
      setTitle("");
      return;
    }
    startTransition(async () => {
      await addGoal(formData);
      formRef.current?.reset();
      setTitle("");
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={onSubmit} className="card" style={{ gap: 18 }}>
      <input type="hidden" name="partnership_id" value={partnershipId} />
      <div className="field">
        <label htmlFor="goal-title">A goal for the period ahead</label>
        <input
          id="goal-title"
          name="title"
          placeholder="Raise treatment plan acceptance to seventy percent"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="goal-detail">The measure, in your own words (optional)</label>
        <input
          id="goal-detail"
          name="detail"
          placeholder="Tracked weekly with the new treatment coordinator"
        />
      </div>
      <div className="row">
        <Button type="submit" size="sm" disabled={pending || !title.trim()}>
          {pending ? "Setting down" : "Set down the goal"}
        </Button>
      </div>
    </form>
  );
}
