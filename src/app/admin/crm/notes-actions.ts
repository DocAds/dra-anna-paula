"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createNote(leadId: string, content: string) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await sb.from("lead_notes").insert({
    lead_id: leadId,
    author_id: user.id,
    content,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/crm/leads/${leadId}`);
}

export async function updateNote(id: string, leadId: string, content: string) {
  const sb = await createClient();
  const { error } = await sb.from("lead_notes").update({ content }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/crm/leads/${leadId}`);
}

export async function deleteNote(id: string, leadId: string) {
  const sb = await createClient();
  const { error } = await sb.from("lead_notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/crm/leads/${leadId}`);
}
