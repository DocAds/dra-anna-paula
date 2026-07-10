import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CategoriesManager } from "./CategoriesManager";
import { createCategory, deleteCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const sb = await createClient();
  const { data: categories = [] } = await sb
    .from("post_categories")
    .select("id, name, slug, created_at")
    .order("name");
  const { count } = await sb.from("posts").select("*", { count: "exact", head: true });

  return (
    <main className="p-8 md:p-12">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-2">
        <div>
          <Link href="/admin/posts" className="text-[11px] uppercase tracking-widest3 text-toffee underline-editorial">
            ← Posts
          </Link>
          <h1 className="font-display text-4xl text-ink mt-3">Categorias</h1>
        </div>
        <div className="text-[11px] uppercase tracking-widest2 text-ink/55">
          {count ?? 0} posts no total
        </div>
      </div>
      <p className="text-sm text-ink/55 mb-8 max-w-xl">
        Categorias aparecem na lista do blog público e na ficha de cada post. Exclusões não removem posts existentes, só o link da categoria.
      </p>
      <CategoriesManager
        initial={categories || []}
        onCreate={createCategory}
        onDelete={deleteCategory}
      />
    </main>
  );
}
