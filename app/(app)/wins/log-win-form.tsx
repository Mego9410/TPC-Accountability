"use client";

import { Form, SubmitButton } from "@/components/ui/form";
import { Field, Select, TextArea } from "@/components/ui";
import { logWin } from "@/lib/actions/wins";

export function LogWinForm({ blocks, defaultBlockId }: { blocks: Array<{ value: string; label: string }>; defaultBlockId: string | null }) {
  return (
    <Form action={logWin} resetOnSuccess>
      {(state) => (
        <>
          <Field label="The win" name="title" required maxLength={140} placeholder="Treatment plan acceptance crossed 68%" error={state.errors.title} />
          <TextArea label="Detail" name="detail" rows={2} maxLength={600} placeholder="What made it happen, or what it made possible." error={state.errors.detail} />
          <div className="form-row">
            <Select
              label="Block"
              name="block_id"
              options={blocks}
              placeholder="Not part of a block"
              defaultValue={defaultBlockId ?? ""}
              error={state.errors.block_id}
              help="Wins belong to the block they came out of."
            />
          </div>
          <div className="form-actions">
            <SubmitButton size="sm" pendingText="Logging…">Log it</SubmitButton>
          </div>
        </>
      )}
    </Form>
  );
}
