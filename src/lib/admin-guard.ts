import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminSection, Profile } from "@/lib/supabase/types";

/**
 * Garante que o usuário logado pode acessar a seção do admin.
 * Admin tem acesso total; editor só às seções liberadas em profile.sections.
 * Use no topo dos server components das páginas de seção controlada.
 */
export async function requireSection(section: AdminSection) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, sections")
    .eq("id", user.id)
    .single<Pick<Profile, "role" | "sections">>();

  if (!profile) redirect("/login");
  if (profile.role === "admin") return profile;
  if (!(profile.sections ?? []).includes(section)) redirect("/admin");
  return profile;
}

/** Garante que o usuário logado é admin (seções restritas a master). */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role !== "admin") redirect("/admin");
}

/**
 * Mesma checagem de requireSection, para SERVER ACTIONS.
 *
 * Por que existe separada: redirect() dentro de uma action vira erro de
 * navegação, não bloqueio, e a página que chama a action já passou pelo guarda
 * de rota. O ponto aqui é outro: a action é um endpoint próprio, exposto no
 * bundle, e pode ser chamada direto por quem nunca abriu a tela. Esconder o
 * botão não é controle de acesso.
 */
export async function assertSection(section: AdminSection) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, sections")
    .eq("id", user.id)
    .single<Pick<Profile, "role" | "sections">>();

  if (!profile) throw new Error("Não autenticado.");
  if (profile.role === "admin") return { user, profile };
  if (!(profile.sections ?? []).includes(section)) {
    throw new Error("Você não tem permissão para esta seção.");
  }
  return { user, profile };
}

/** Igual a assertSection, mas exige papel de admin. */
export async function assertAdminRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  if (profile?.role !== "admin") throw new Error("Ação restrita a administradores.");
  return user;
}
