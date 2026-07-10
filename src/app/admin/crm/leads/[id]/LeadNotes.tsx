"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, Check, AlertCircle } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";

type Note = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: { name: string | null; email: string } | null;
};

const iconBtn =
  "grid place-items-center min-h-11 min-w-11 rounded-full text-ink/70 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50";

export function LeadNotes({
  leadId,
  initial,
  onCreate,
  onUpdate,
  onDelete,
  currentUserEmail,
}: {
  leadId: string;
  initial: Note[];
  onCreate: (leadId: string, content: string) => Promise<void>;
  onUpdate: (id: string, leadId: string, content: string) => Promise<void>;
  onDelete: (id: string, leadId: string) => Promise<void>;
  currentUserEmail?: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function add() {
    if (!newContent.trim()) return;
    const prev = notes;
    const tmpId = `tmp-${Date.now()}`;
    const optimistic: Note = {
      id: tmpId,
      content: newContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: currentUserEmail ? { name: null, email: currentUserEmail } : null,
    };
    setNotes([optimistic, ...notes]);
    const c = newContent;
    setNewContent("");
    setAdding(false);
    setError(null);
    start(async () => {
      try {
        await onCreate(leadId, c);
        router.refresh(); // reconcilia o id temporário com o real do servidor
      } catch {
        setNotes(prev);
        setError("Não foi possível salvar o comentário. Tente de novo.");
      }
    });
  }

  async function save(id: string) {
    if (!editingContent.trim()) return;
    const prev = notes;
    setNotes((cur) =>
      cur.map((n) =>
        n.id === id ? { ...n, content: editingContent, updated_at: new Date().toISOString() } : n
      )
    );
    const c = editingContent;
    setEditingId(null);
    setError(null);
    start(async () => {
      try {
        await onUpdate(id, leadId, c);
        router.refresh();
      } catch {
        setNotes(prev);
        setError("Não foi possível salvar a edição. Tente de novo.");
      }
    });
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta anotação?")) return;
    const prev = notes;
    setNotes((cur) => cur.filter((n) => n.id !== id));
    setError(null);
    start(async () => {
      try {
        await onDelete(id, leadId);
        router.refresh();
      } catch {
        setNotes(prev);
        setError("Não foi possível excluir. Tente de novo.");
      }
    });
  }

  return (
    <section className="editorial-card rounded-3xl p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[10px] uppercase tracking-widest3 text-cocoa">Comentários da equipe</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest2 text-cocoa hover:text-ink transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50 rounded-full px-1"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar comentário
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-rose-700 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {adding && (
        <div className="mb-5 border border-cocoa/15 rounded-2xl p-4 bg-porcelain/50 focus-within:border-cocoa transition-colors">
          <textarea
            autoFocus
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            aria-label="Novo comentário"
            placeholder="Ex: liguei e o lead vai retornar até sexta..."
            className="w-full bg-transparent outline-none text-ink text-sm leading-relaxed resize-none"
          />
          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => { setAdding(false); setNewContent(""); }}
              className="text-[11px] uppercase tracking-widest2 text-ink/70 hover:text-cocoa transition-colors motion-reduce:transition-none px-3 py-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={add}
              disabled={pending || !newContent.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-4 py-2 text-[11px] uppercase tracking-widest2 hover:bg-ink transition-colors motion-reduce:transition-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60"
            >
              <Check className="h-3.5 w-3.5" /> Salvar
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 && !adding ? (
        <p className="text-sm text-ink/70 italic">Nenhum comentário ainda. Use o botão acima pra registrar contatos e observações.</p>
      ) : (
        <ul className="divide-y divide-cocoa/10">
          {notes.map((n) => {
            const isEditing = editingId === n.id;
            const wasEdited = new Date(n.updated_at).getTime() - new Date(n.created_at).getTime() > 1000;
            return (
              <li key={n.id} className="py-3 first:pt-0 last:pb-0 group">
                {isEditing ? (
                  <>
                    <textarea
                      autoFocus
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={4}
                      aria-label="Editar comentário"
                      className="w-full bg-porcelain/60 border border-cocoa/15 rounded-xl p-3 outline-none text-ink text-sm leading-relaxed resize-none focus:border-cocoa focus-visible:ring-2 focus-visible:ring-cocoa/40 transition-colors"
                    />
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-[11px] uppercase tracking-widest2 text-ink/70 hover:text-cocoa transition-colors motion-reduce:transition-none px-3 py-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/40"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => save(n.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-4 py-1.5 text-[11px] uppercase tracking-widest2 hover:bg-ink transition-colors motion-reduce:transition-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60"
                      >
                        <Check className="h-3.5 w-3.5" /> Salvar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[10px] uppercase tracking-widest2 text-ink/70 flex items-center gap-2 mb-1.5">
                      <span>
                        {format(new Date(n.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {wasEdited && <span className="italic normal-case tracking-normal">· editada {format(new Date(n.updated_at), "dd MMM HH:mm", { locale: ptBR })}</span>}
                      {n.author?.name || n.author?.email ? (
                        <span className="italic normal-case tracking-normal">· {n.author.name || n.author.email}</span>
                      ) : null}
                      <span className="ml-auto flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity motion-reduce:transition-none">
                        <button
                          type="button"
                          onClick={() => { setEditingId(n.id); setEditingContent(n.content); }}
                          className={`${iconBtn} hover:text-cocoa`}
                          aria-label="Editar comentário"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(n.id)}
                          className={`${iconBtn} hover:text-rose-700`}
                          aria-label="Excluir comentário"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </div>
                    <p className="text-ink/85 text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
