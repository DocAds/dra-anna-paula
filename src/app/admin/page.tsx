import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FileText, Eye, Pencil, Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [{ count: total }, { count: published }, { count: drafts }, { data: recent }] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase
      .from("posts")
      .select("id, slug, title, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { v: total ?? 0, l: "Posts no total", icon: FileText },
    { v: published ?? 0, l: "Publicados", icon: Eye },
    { v: drafts ?? 0, l: "Rascunhos", icon: Pencil },
  ];

  return (
    <main className="p-8 md:p-12">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-3">Painel</div>
          <h1 className="font-display text-4xl text-ink leading-tight">
            Boa vinda, Dra.
          </h1>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-5 py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo post
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-12">
        {stats.map((s) => (
          <div key={s.l} className="editorial-card rounded-3xl p-6">
            <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cocoa/10 text-cocoa">
              <s.icon className="h-4 w-4" />
            </div>
            <div className="font-display text-4xl text-ink leading-none">{s.v}</div>
            <div className="text-[11px] uppercase tracking-widest2 text-ink/55 mt-3">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="editorial-card rounded-3xl p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl text-ink">Atualizações recentes</h2>
          <Link href="/admin/posts" className="text-[11px] uppercase tracking-widest2 text-cocoa underline-editorial">
            Ver todos
          </Link>
        </div>
        {!recent?.length ? (
          <p className="text-ink/55 text-sm">Nenhum post ainda. <Link href="/admin/posts/new" className="text-cocoa underline-editorial">Crie o primeiro</Link>.</p>
        ) : (
          <ul className="divide-y divide-cocoa/10">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/posts/${p.id}`}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-4 hover:bg-cocoa/5 transition-colors px-2 -mx-2 rounded-xl"
                >
                  <div className="min-w-0">
                    <div className="font-display text-lg text-ink truncate">{p.title}</div>
                    <div className="text-[11px] uppercase tracking-widest2 text-ink/45 mt-1">/{p.slug}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${
                    p.status === "published" ? "bg-cocoa text-bone" : "bg-cocoa/10 text-cocoa"
                  }`}>
                    {p.status === "published" ? "publicado" : p.status === "draft" ? "rascunho" : "arquivado"}
                  </span>
                  <span className="text-[11px] text-ink/55 hidden sm:inline">
                    {format(new Date(p.updated_at), "dd 'de' MMM", { locale: ptBR })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
