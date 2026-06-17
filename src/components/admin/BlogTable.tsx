"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Trash2 } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import { bulkSetStatus, bulkDeletePosts } from "@/app/admin/posts/actions";

type Row = {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string | null;
  updated_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  published: "publicado",
  draft: "rascunho",
  archived: "arquivado",
};

export function BlogTable({ posts }: { posts: Row[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const allSelected = posts.length > 0 && sel.size === posts.length;

  function toggle(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSel(allSelected ? new Set() : new Set(posts.map((p) => p.id)));
  }
  function publish() {
    start(async () => { await bulkSetStatus([...sel], "published"); setSel(new Set()); });
  }
  function draft() {
    start(async () => { await bulkSetStatus([...sel], "draft"); setSel(new Set()); });
  }
  function remove() {
    if (!confirm(`Excluir ${sel.size} post(s)? Não dá pra desfazer.`)) return;
    start(async () => { await bulkDeletePosts([...sel]); setSel(new Set()); });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 px-2">
        <label className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest2 text-ink/55 cursor-pointer">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-cocoa h-4 w-4" />
          Selecionar todos
        </label>
        {sel.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <span className="text-[11px] uppercase tracking-widest2 text-ink/45">{sel.size} selecionado(s)</span>
            <button onClick={publish} disabled={pending} className="rounded-full bg-cocoa text-bone px-4 py-1.5 text-[11px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50">Publicar</button>
            <button onClick={draft} disabled={pending} className="rounded-full border border-cocoa/30 text-cocoa px-4 py-1.5 text-[11px] uppercase tracking-widest2 hover:bg-cocoa hover:text-bone transition-colors disabled:opacity-50">Rascunho</button>
            <button onClick={remove} disabled={pending} className="inline-flex items-center gap-1 rounded-full border border-red-700/30 text-red-700 px-4 py-1.5 text-[11px] uppercase tracking-widest2 hover:bg-red-700 hover:text-white transition-colors disabled:opacity-50">
              <Trash2 className="h-3 w-3" /> Excluir
            </button>
          </div>
        )}
      </div>

      <ul className="grid gap-3">
        {posts.map((p) => {
          const checked = sel.has(p.id);
          return (
            <li
              key={p.id}
              className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 editorial-card rounded-3xl px-6 py-5 transition-all duration-300 ${
                checked ? "ring-1 ring-cocoa/40" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(p.id)}
                className="accent-cocoa h-4 w-4"
                aria-label={`Selecionar ${p.title}`}
              />
              <Link href={`/admin/posts/${p.id}`} className="min-w-0 group">
                <div className="font-display text-xl text-ink truncate group-hover:text-cocoa transition-colors">{p.title}</div>
                <div className="text-[11px] uppercase tracking-widest2 text-ink/45 mt-1 flex flex-wrap gap-3">
                  <span>/{p.slug}</span>
                  {p.category && <span>· {p.category}</span>}
                </div>
              </Link>
              <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${
                p.status === "published" ? "bg-cocoa text-bone" : "bg-cocoa/10 text-cocoa"
              }`}>
                {STATUS_LABEL[p.status] ?? p.status}
              </span>
              <Link href={`/admin/posts/${p.id}`} className="hidden sm:flex items-center gap-3 text-[11px] text-ink/55 hover:text-cocoa transition-colors">
                <span>{format(new Date(p.updated_at), "dd MMM yy", { locale: ptBR })}</span>
                <ArrowRight className="h-4 w-4 text-cocoa" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
