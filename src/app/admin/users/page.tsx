import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import type { Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function UsersList() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (me?.role !== "admin") redirect("/admin");

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Profile[]>();

  return (
    <main className="p-8 md:p-12">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-3">Equipe</div>
          <h1 className="font-display text-4xl text-ink leading-tight">Usuários</h1>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-5 py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo usuário
        </Link>
      </div>

      <ul className="grid gap-3">
        {users?.map((u) => (
          <li key={u.id}>
            <Link
              href={`/admin/users/${u.id}`}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 editorial-card rounded-3xl px-6 py-5 hover:-translate-y-0.5 transition-all duration-500"
            >
              <div className="min-w-0">
                <div className="font-display text-xl text-ink truncate">{u.name || u.email}</div>
                <div className="text-[11px] uppercase tracking-widest2 text-ink/45 mt-1">{u.email}</div>
              </div>
              <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${
                u.role === "admin" ? "bg-cocoa text-bone" : "bg-cocoa/10 text-cocoa"
              }`}>
                {u.role}
              </span>
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-ink/55">
                <span>desde {format(new Date(u.created_at), "MMM yy", { locale: ptBR })}</span>
                <ArrowRight className="h-4 w-4 text-cocoa" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
