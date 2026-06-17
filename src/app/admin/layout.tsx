import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoAB } from "@/components/LogoAB";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogOut, ExternalLink } from "lucide-react";
import { signOut } from "./actions";
import type { Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

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

  return (
    <div className="min-h-screen bg-bone grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-r border-cocoa/10 bg-gradient-to-b from-porcelain to-bone p-6 md:sticky md:top-0 md:h-screen flex flex-col">
        <Link href="/admin" className="flex items-center mb-10">
          <LogoAB variant="full" className="h-6 w-auto" />
        </Link>
        <AdminNav isAdmin={profile.role === "admin"} sections={profile.sections ?? []} />
        <div className="mt-6 border-t border-cocoa/10 pt-5 space-y-4">
          <div className="rounded-2xl bg-cocoa/[0.06] border border-cocoa/10 px-4 py-3">
            <div className="text-[9px] uppercase tracking-widest3 text-ink/40 mb-1">Logado como</div>
            <div className="text-sm font-display text-ink truncate leading-tight">{profile.name || profile.email}</div>
            <span className="mt-2 inline-block rounded-full bg-cocoa/10 px-2.5 py-0.5 text-[9px] uppercase tracking-widest2 text-cocoa">
              {profile.role}
            </span>
          </div>
          <div className="space-y-2.5 px-1">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-cocoa transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver site público
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2 text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-cocoa transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
