import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebarContent } from "@/components/admin/AdminSidebarContent";
import { AdminMobileBar } from "@/components/admin/AdminMobileBar";
import type { Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="min-h-screen bg-porcelain flex items-center justify-center px-6">
        <div className="editorial-card rounded-3xl p-10 max-w-lg text-center">
          <h1 className="font-display text-2xl text-ink mb-4">Supabase não configurado</h1>
          <p className="text-ink/70 text-sm leading-relaxed">
            Defina as variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code> e
            <code className="ml-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no <code>.env.local</code>.
            Veja <code>supabase/README.md</code>.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login?error=Sem%20perfil");

  const isAdmin = profile.role === "admin";
  const sections = profile.sections ?? [];
  const name = profile.name || profile.email;

  return (
    <div className="min-h-screen bg-bone">
      <AdminMobileBar>
        <AdminSidebarContent isAdmin={isAdmin} sections={sections} name={name} role={profile.role} />
      </AdminMobileBar>
      <div className="md:grid md:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-cocoa/10 bg-gradient-to-b from-porcelain to-bone p-6 md:sticky md:top-0 md:flex md:h-screen md:flex-col">
          <AdminSidebarContent isAdmin={isAdmin} sections={sections} name={name} role={profile.role} />
        </aside>
        <div className="flex flex-col">{children}</div>
      </div>
    </div>
  );
}
