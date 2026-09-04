import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { MemberRole } from "@/lib/domain";
import { getViewer, type Viewer } from "@/lib/session";

import { EMPTY_STATE, type ActionState } from "./state";
export { EMPTY_STATE, type ActionState };

type Outcome = {
  message?: string;
  data?: Record<string, string>;
  /** Paths to revalidate; defaults to the whole app tree. */
  revalidate?: string[];
  redirectTo?: string;
};

/**
 * One contract for every mutation: parse with zod, resolve the viewer, check
 * the role, run, flush the repo, revalidate, redirect. Errors become inline
 * form state; nothing is swallowed.
 */
export function defineAction<S extends z.ZodTypeAny>(opts: {
  schema: S;
  roles?: MemberRole[];
  run: (ctx: Viewer, input: z.infer<S>) => Promise<Outcome | void>;
}) {
  return async function action(_prev: ActionState, formData: FormData): Promise<ActionState> {
    const viewer = await getViewer();
    if (!viewer) redirect("/login");
    if (opts.roles && !opts.roles.includes(viewer.profile.role)) {
      return { ok: false, message: "You do not have leave to do that.", errors: {} };
    }

    const parsed = opts.schema.safeParse(formToObject(formData));
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errors[key]) errors[key] = issue.message;
      }
      return { ok: false, message: errors.form ?? "Please check the highlighted fields.", errors };
    }

    let outcome: Outcome | void;
    try {
      outcome = await opts.run(viewer, parsed.data);
      await viewer.repo.flush();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      return { ok: false, message, errors: {} };
    }

    for (const p of outcome?.revalidate ?? ["/", "layout"]) {
      if (p === "layout") revalidatePath("/", "layout");
      else revalidatePath(p);
    }
    if (outcome?.redirectTo) redirect(outcome.redirectTo);
    return { ok: true, message: outcome?.message ?? null, errors: {}, data: outcome?.data };
  };
}

/** FormData -> plain object. Repeated keys (checkbox groups) become arrays. */
export function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of fd.entries()) {
    if (typeof value !== "string") continue;
    if (key.endsWith("[]")) {
      const k = key.slice(0, -2);
      const existing = out[k] as string[] | undefined;
      if (existing) existing.push(value);
      else out[k] = [value];
    } else if (key in out) {
      out[key] = Array.isArray(out[key]) ? [...(out[key] as string[]), value] : [out[key] as string, value];
    } else {
      out[key] = value;
    }
  }
  return out;
}

/* ---------- Shared zod helpers ---------- */
export const zText = (label: string, max = 280) =>
  z.string().trim().min(1, `${label} is needed.`).max(max, `${label} is too long.`);
export const zOptText = (max = 2000) =>
  z.string().trim().max(max, "Too long.").optional().transform((v) => (v ? v : null));
export const zList = z.union([z.array(z.string()), z.string()]).optional().transform((v) => (Array.isArray(v) ? v : v ? [v] : []));
export const zInt = (min: number, max: number, label = "Value") =>
  z.coerce.number({ message: `${label} must be a number.` }).int().min(min, `${label} must be at least ${min}.`).max(max, `${label} must be at most ${max}.`);
export const zDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");
