import type { Metadata } from "next";
import { format } from "date-fns";
import { requireUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Body, Button, Card, Caption, Divider, Eyebrow, H1, H3 } from "@/components/ui";
import { instantiateTemplate } from "@/lib/actions/templates";
import type { GoalBlockTemplate, TemplateCommitment } from "@/lib/types";

export const metadata: Metadata = { title: "Goal templates" };

export default async function TemplatesPage() {
  await requireUserProfile();
  const supabase = await createClient();

  const [{ data: templateRows }, { data: tcRows }] = await Promise.all([
    supabase.from("goal_block_templates").select("*").order("sort", { ascending: true }),
    supabase.from("template_commitments").select("*").order("week_number", { ascending: true }),
  ]);
  const templates = (templateRows ?? []) as GoalBlockTemplate[];
  const commitments = (tcRows ?? []) as TemplateCommitment[];
  const today = format(new Date(), "yyyy-MM-dd");

  const byTemplate = new Map<string, TemplateCommitment[]>();
  for (const c of commitments) byTemplate.set(c.template_id, [...(byTemplate.get(c.template_id) ?? []), c]);

  return (
    <div className="section fade-enter">
      <Eyebrow>For principal dentists</Eyebrow>
      <H1>Goal templates.</H1>
      <Body className="muted" style={{ maxWidth: 640 }}>
        Proven twelve-week plans for the goals principals most often pursue. Pick
        one and it lays out the block and a starter set of weekly commitments —
        all yours to edit.
      </Body>

      <Divider />

      {templates.length === 0 ? (
        <Caption>No templates available yet.</Caption>
      ) : (
        <div className="grid-2">
          {templates.map((t) => {
            const preview = byTemplate.get(t.id) ?? [];
            return (
              <Card key={t.id}>
                <Eyebrow>Template</Eyebrow>
                <H3>{t.title}</H3>
                {t.description && <Caption style={{ marginTop: 6 }}>{t.description}</Caption>}

                {preview.length > 0 && (
                  <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>
                    {preview.slice(0, 4).map((c) => (
                      <li key={c.id}>
                        <Caption>
                          Week {c.week_number}: {c.text}
                        </Caption>
                      </li>
                    ))}
                  </ul>
                )}

                <form
                  action={instantiateTemplate}
                  className="row gap-4"
                  style={{ marginTop: 16, alignItems: "flex-end", flexWrap: "wrap" }}
                >
                  <input type="hidden" name="template_id" value={t.id} />
                  <div className="field" style={{ width: 180 }}>
                    <label htmlFor={`start-${t.id}`}>Start date</label>
                    <input id={`start-${t.id}`} name="start_date" type="date" defaultValue={today} />
                  </div>
                  <Button type="submit" size="sm">
                    Use this template
                  </Button>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
