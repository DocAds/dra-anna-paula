import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import { getAiConfig } from "./ai-actions";
import { AiConfigButton } from "@/components/admin/AiConfigButton";
import { BlogTable } from "@/components/admin/BlogTable";
import { requireSection } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function PostsList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireSection("posts");
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
  const aiCfg = await getAiConfig();

  const tabs = [
    { v: "", l: "Todos" },
    { v: "published", l: "Publicados" },
    { v: "draft", l: "Rascunhos" },
    { v: "archived", l: "Arquivados" },
  ];

  return (
    <main className="p-8 md:p-12">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-3">Conteúdo</div>
          <h1 className="font-display text-4xl text-ink leading-tight">Posts</h1>
        </div>
        <div className="flex items-center gap-3">
          <AiConfigButton
            initial={
              aiCfg
                ? {
                    provider: aiCfg.provider ?? undefined,
                    model: aiCfg.model ?? undefined,
                    instructions: aiCfg.instructions ?? undefined,
                    hasToken: aiCfg.has_token,
                  }
                : null
            }
          />
          <Link
            href="/admin/posts/categorias"
            className="inline-flex items-center gap-2 rounded-full border border-cocoa/30 text-cocoa px-5 py-3 text-[12px] uppercase tracking-widest2 hover:bg-cocoa hover:text-bone transition-colors"
          >
            Categorias
          </Link>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-5 py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors"
          >
            <Plus className="h-4 w-4" /> Novo post
          </Link>
        </div>
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
        <BlogTable posts={posts} />
      )}
    </main>
  );
}
