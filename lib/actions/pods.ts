"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/accountability";

/**
 * Pod administration (master doc Step 3.1). Pods are created and staffed by the
 * Club (an admin), so writes use the service-role client and bypass RLS —
 * guarded here by an explicit admin check (profiles.role = 'house'). Members
 * never reach these actions.
 */
async function getAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "house" ? user.id : null;
}

export async function createPod(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const cohort = String(formData.get("cohort_label") ?? "").trim() || null;
  if (!name) return { ok: false, message: null, errors: { name: "Name the pod." } };

  const adminId = await getAdminId();
  if (!adminId) return { ok: false, message: "Administrators only.", errors: {} };

  const svc = createServiceClient();
  const { error } = await svc.from("pods").insert({ name, cohort_label: cohort, status: "active" });
  if (error) return { ok: false, message: "We couldn't create that pod.", errors: {} };

  revalidatePath("/accountability/admin/pods");
  return { ok: true, message: "Pod created.", errors: {} };
}

export async function assignPodMember(formData: FormData): Promise<void> {
  const podId = String(formData.get("pod_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "member") === "lead" ? "lead" : "member";
  const adminId = await getAdminId();
  if (!adminId || !podId || !userId) return;

  const svc = createServiceClient();
  await svc
    .from("pod_members")
    .upsert({ pod_id: podId, user_id: userId, role, left_at: null }, { onConflict: "pod_id,user_id" });
  revalidatePath("/accountability/admin/pods");
}

export async function removePodMember(formData: FormData): Promise<void> {
  const podId = String(formData.get("pod_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const adminId = await getAdminId();
  if (!adminId || !podId || !userId) return;

  const svc = createServiceClient();
  await svc
    .from("pod_members")
    .update({ left_at: new Date().toISOString() })
    .eq("pod_id", podId)
    .eq("user_id", userId);
  revalidatePath("/accountability/admin/pods");
}

export async function setPodStatus(formData: FormData): Promise<void> {
  const podId = String(formData.get("pod_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["active", "archived"].includes(status)) return;
  const adminId = await getAdminId();
  if (!adminId || !podId) return;

  const svc = createServiceClient();
  await svc.from("pods").update({ status }).eq("id", podId);
  revalidatePath("/accountability/admin/pods");
}
