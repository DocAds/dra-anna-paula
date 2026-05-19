import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoAB } from "@/components/LogoAB";
import { LayoutDashboard, FileText, Users, Settings, LogOut, ExternalLink, BarChart3, Trello } from "lucide-react";
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

  const nav = [
    { href: "/admin", label: "Painel", icon: LayoutDashboard },
    { href: "/admin/crm", label: "Dashboard", icon: BarChart3 },
    { href: "/admin/crm/leads", label: "Leads", icon: Users },
    { href: "/admin/posts", label: "Posts", icon: FileText },
    ...(profile.role === "admin" ? [{ href: "/admin/users", label: "Usuários", icon: Users }] : []),
    { href: "/admin/configuracoes", label: "Conta", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-bone grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-r border-cocoa/10 bg-porcelain p-6 md:sticky md:top-0 md:h-screen flex flex-col">
        <Link href="/admin" className="flex items-center mb-10">
          <LogoAB variant="full" className="h-6 w-auto" />
        </Link>
        <nav className="flex-1 flex flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-ink/70 hover:bg-cocoa/8 hover:text-cocoa transition-colors"
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-cocoa/10 pt-5 space-y-3">
          <div className="text-[10px] uppercase tracking-widest3 text-ink/45">Logado como</div>
          <div className="text-sm font-display text-ink truncate">{profile.name || profile.email}</div>
          <div className="text-[10px] uppercase tracking-widest3 text-toffee">{profile.role}</div>
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
      </aside>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
