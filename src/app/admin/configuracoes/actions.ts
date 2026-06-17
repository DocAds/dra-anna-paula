"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type Result = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return { supabase, user };
}

export async function updateMyName(formData: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) return { ok: false, message: "Informe um nome válido." };

  const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  // Mantém o metadata do auth alinhado com o profile.
  await supabase.auth.updateUser({ data: { name } });

  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Nome atualizado." };
}

export async function updateMyEmail(formData: FormData): Promise<Result> {
  const { supabase, user } = await requireUser();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, message: "E-mail inválido." };
  if (email === user.email) return { ok: false, message: "Este já é o seu e-mail atual." };

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { ok: false, message: error.message };

  return {
    ok: true,
    message: "Enviamos um link de confirmação para o novo e-mail. A troca só vale após você confirmar.",
  };
}

export async function updateMyPassword(formData: FormData): Promise<Result> {
  const { supabase } = await requireUser();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  if (password.length < 8) return { ok: false, message: "A senha precisa ter ao menos 8 caracteres." };
  if (password !== confirm) return { ok: false, message: "As senhas não coincidem." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "Senha alterada com sucesso." };
}
