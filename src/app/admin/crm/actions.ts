"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadFase, LeadTemperatura } from "@/lib/supabase/types";

export async function updateLead(id: string, formData: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const fase = formData.get("fase") as LeadFase | null;
  const temperatura = formData.get("temperatura") as LeadTemperatura | null;
  const notas = String(formData.get("notas") || "");
  const cidade = String(formData.get("cidade") || "");

  const { error } = await sb
    .from("leads")
    .update({
      fase: fase || "novo",
      temperatura: temperatura || "morno",
      notas: notas || null,
      cidade: cidade || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/leads/${id}`);
}

export async function moveLeadFase(id: string, fase: LeadFase) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await sb.from("leads").update({ fase }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/crm/kanban");
  revalidatePath("/admin/crm/leads");
  revalidatePath(`/admin/crm/leads/${id}`);
}

export async function deleteLead(id: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await sb.from("leads").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/crm/leads");
  redirect("/admin/crm/leads");
}
