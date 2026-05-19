import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function PostsList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  let q = supabase
    .from("posts")
    .select("id, slug, title, excerpt, status, category, updated_at, published_at")
    .order("updated_at", { ascending: false });
  if (status === "published" || status === "draft" || status === "archived") {
    q = q.eq("status", status);
  }
  const { data: posts } = await q;

  const tabs = [
    { v: "", l: "Todos" },
    { v: "published", l: "Publicados" },
    { v: "draft", l: "Rascunhos" },
    { v: "archived", l: "Arquivados" },
  ];

  return (
    <main className="p-8 md:p-12">
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-3">Conteúdo</div>
          <h1 className="font-display text-4xl text-ink leading-tight">Posts</h1>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-5 py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors"
        >
          <Plus className="h-4 w-4" /> Novo post
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => {
          const active = (status || "") === t.v;
          return (
            <Link
              key={t.v}
              href={t.v ? `/admin/posts?status=${t.v}` : "/admin/posts"}
              className={`text-[11px] uppercase tracking-widest2 rounded-full px-4 py-2 transition-colors ${
                active ? "bg-cocoa text-bone" : "border border-cocoa/20 text-ink/65 hover:border-cocoa hover:text-cocoa"
              }`}
            >
              {t.l}
            </Link>
          );
        })}
      </div>

      {!posts?.length ? (
        <div className="editorial-card rounded-3xl p-10 text-center">
          <h2 className="font-display text-2xl text-ink mb-3">Nenhum post {status ? "neste status" : "ainda"}.</h2>
          <p className="text-ink/65 text-sm mb-6">Crie o primeiro post do diário.</p>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-5 py-3 text-[12px] uppercase tracking-widest2"
          >
            <Plus className="h-4 w-4" /> Novo post
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/posts/${p.id}`}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 editorial-card rounded-3xl px-6 py-5 hover:-translate-y-0.5 transition-all duration-500"
              >
                <div className="min-w-0">
                  <div className="font-display text-xl text-ink truncate">{p.title}</div>
                  <div className="text-[11px] uppercase tracking-widest2 text-ink/45 mt-1 flex flex-wrap gap-3">
                    <span>/{p.slug}</span>
                    {p.category && <span>· {p.category}</span>}
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${
                  p.status === "published" ? "bg-cocoa text-bone" : "bg-cocoa/10 text-cocoa"
                }`}>
                  {p.status === "published" ? "publicado" : p.status === "draft" ? "rascunho" : "arquivado"}
                </span>
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-ink/55">
                  <span>{format(new Date(p.updated_at), "dd MMM yy", { locale: ptBR })}</span>
                  <ArrowRight className="h-4 w-4 text-cocoa" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
