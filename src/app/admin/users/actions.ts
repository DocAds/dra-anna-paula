"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/supabase/types";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Sem permissão");
}

export async function createUser(formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "");
  const role = (formData.get("role") as UserRole) || "editor";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error) throw new Error(error.message);
  // garante role correta no profile (trigger pode usar default)
  await admin.from("profiles").update({ role, name }).eq("id", data.user!.id);

  revalidatePath("/admin/users");
  redirect("/admin/users?ok=created");
}

export async function updateUser(id: string, formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();
  const name = String(formData.get("name") || "");
  const role = (formData.get("role") as UserRole) || "editor";
  const password = String(formData.get("password") || "");

  const { error } = await admin.from("profiles").update({ name, role }).eq("id", id);
  if (error) throw new Error(error.message);

  if (password) {
    await admin.auth.admin.updateUserById(id, { password });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
}

export async function deleteUser(id: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
  redirect("/admin/users?ok=deleted");
}
