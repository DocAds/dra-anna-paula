"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";

type Cat = { id: string; name: string; slug: string; created_at: string };

export function CategoriesManager({
  initial,
  onCreate,
  onDelete,
}: {
  initial: Cat[];
  onCreate: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    setItems([...items, { id: `tmp-${Date.now()}`, name: n, slug: n.toLowerCase(), created_at: new Date().toISOString() }]);
    setName("");
    start(async () => {
      try { await onCreate(n); } catch (e) { alert(String(e)); }
    });
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Excluir categoria "${label}"?`)) return;
    setItems(items.filter((c) => c.id !== id));
    start(async () => {
      try { await onDelete(id); } catch (e) { alert(String(e)); }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ul className="grid gap-2">
        {items.length === 0 && (
          <li className="editorial-card rounded-3xl p-8 text-center text-ink/55">
            Nenhuma categoria. Adicione a primeira no painel ao lado.
          </li>
        )}
        {items.map((c) => (
          <li
            key={c.id}
            className="editorial-card rounded-3xl px-6 py-4 flex items-center justify-between group"
          >
            <div>
              <div className="font-display text-lg text-ink">{c.name}</div>
              <div className="text-[10px] uppercase tracking-widest3 text-ink/45 mt-0.5">/{c.slug}</div>
            </div>
            <button
              type="button"
              onClick={() => remove(c.id, c.name)}
              disabled={pending}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-ink/55 hover:text-red-700"
              aria-label="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <aside>
        <form onSubmit={add} className="editorial-card rounded-3xl p-6 space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">Nova categoria</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bem-estar"
              className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-cocoa text-bone py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </form>
      </aside>
    </div>
  );
}
