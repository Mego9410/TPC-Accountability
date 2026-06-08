"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { blockEndDate } from "@/lib/accountability";
import type { GoalBlockTemplate, TemplateCommitment } from "@/lib/types";

/**
 * Instantiate a goal block from a template (master doc Step 3.5): one tap
 * creates a populated 12-week block plus its suggested weekly commitments.
 */
export async function instantiateTemplate(formData: FormData): Promise<void> {
  const templateId = String(formData.get("template_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "").trim();
  if (!templateId || !startDate) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: template } = await supabase
    .from("goal_block_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  if (!template) return;
  const t = template as GoalBlockTemplate;

  const { data: tcRows } = await supabase
    .from("template_commitments")
    .select("*")
    .eq("template_id", templateId)
    .order("week_number", { ascending: true })
    .order("sort", { ascending: true });
  const commitments = (tcRows ?? []) as TemplateCommitment[];

  const { data: block, error } = await supabase
    .from("goal_blocks")
    .insert({
      user_id: user.id,
      title: t.title,
      description: t.description,
      start_date: startDate,
      end_date: blockEndDate(startDate),
      status: "active",
    })
    .select("id")
    .single();
  if (error || !block) return;

  if (commitments.length > 0) {
    await supabase.from("commitments").insert(
      commitments.map((c) => ({
        goal_block_id: block.id,
        user_id: user.id,
        week_number: c.week_number,
        text: c.text,
        status: "open",
      })),
    );
  }

  revalidatePath("/accountability/blocks");
  redirect(`/accountability/blocks/${block.id}`);
}
