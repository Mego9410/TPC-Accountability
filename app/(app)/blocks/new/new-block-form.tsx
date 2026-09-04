"use client";

import { Form, SubmitButton } from "@/components/ui/form";
import { Badge, Caption, Card, Eyebrow, Field, Section, TextArea, cn } from "@/components/ui";
import { createBlock } from "@/lib/actions/blocks";
import { BLOCK_WEEKS, type Template } from "@/lib/domain";

/** The start-a-block form: template choice, then the block's own words. */
export function NewBlockForm({ templates, activeTitle, defaultStart }: { templates: Template[]; activeTitle: string | null; defaultStart: string }) {
  return (
    <Form action={createBlock}>
      {(state) => (
        <div className="section">
          <Section title="Choose a starting point">
            <TemplateChoices templates={templates} error={state.errors.template_id} />
          </Section>

          <Section title="The block">
            <Card>
              <Field
                label="Title"
                name="title"
                required
                maxLength={120}
                placeholder="Grow turnover to £150k a month"
                error={state.errors.title}
                help="If you chose a template you may keep its name, or make it your own."
              />
              <TextArea
                label="Description"
                name="description"
                rows={3}
                maxLength={600}
                placeholder="What will be true at the end of the twelve weeks, and why it matters."
                error={state.errors.description}
              />
              <div className="form-row">
                <Field
                  label="Start date"
                  name="start_date"
                  type="date"
                  required
                  defaultValue={defaultStart}
                  error={state.errors.start_date}
                  help={`Blocks run ${BLOCK_WEEKS} weeks from a Monday.`}
                />
              </div>
              <div className="form-actions">
                <SubmitButton pendingText="Setting the block…">Begin the twelve weeks</SubmitButton>
                <Caption>
                  {activeTitle ? `Starting a new block closes “${activeTitle}” and marks it completed.` : "You run one block at a time."}
                </Caption>
              </div>
            </Card>
          </Section>
        </div>
      )}
    </Form>
  );
}

/**
 * Selectable template cards. The kit's ChoiceCards takes a plain-string detail,
 * so this uses its classes with a richer body (a count and a badge).
 */
function TemplateChoices({ templates, error }: { templates: Template[]; error?: string }) {
  const name = "template_id";
  return (
    <fieldset className={cn("field choicecards", error && "has-error")}>
      <legend>Template</legend>
      <div className="choicegrid">
        <label htmlFor={`${name}-own`} className="choice">
          <input id={`${name}-own`} type="radio" name={name} value="" defaultChecked />
          <span className="choice-body">
            <span className="choice-title">Write my own</span>
            <span className="choice-detail">Start with an empty block and set down commitments week by week.</span>
          </span>
        </label>
        {templates.map((t) => {
          const n = t.weeks.length;
          return (
            <label key={t.id} htmlFor={`${name}-${t.id}`} className="choice">
              <input id={`${name}-${t.id}`} type="radio" name={name} value={t.id} />
              <span className="choice-body">
                <span className="choice-head">
                  <span className="choice-title">{t.title}</span>
                  {t.audience === "mentee" && <Badge tone="gold" dot={false}>For newer principals</Badge>}
                </span>
                {t.description && <span className="choice-detail">{t.description}</span>}
                <span className="choice-count">{n} {n === 1 ? "commitment" : "commitments"} set down</span>
              </span>
            </label>
          );
        })}
      </div>
      {error ? <div className="help err" role="alert">{error}</div> : <div className="help">You can reword, add to, or remove any commitment once the block is running.</div>}
      {templates.length === 0 && (
        <div className="empty">
          <Eyebrow>No templates</Eyebrow>
          <Caption>The House has not published any templates yet. Write your own outcome below.</Caption>
        </div>
      )}
    </fieldset>
  );
}
