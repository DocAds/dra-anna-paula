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
