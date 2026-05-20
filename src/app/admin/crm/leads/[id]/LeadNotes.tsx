"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";

type Note = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: { name: string | null; email: string } | null;
};

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
  const [notes, setNotes] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [pending, start] = useTransition();

  async function add() {
    if (!newContent.trim()) return;
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
    start(async () => {
      await onCreate(leadId, c);
    });
  }

  async function save(id: string) {
    if (!editingContent.trim()) return;
    setNotes((cur) =>
      cur.map((n) =>
        n.id === id ? { ...n, content: editingContent, updated_at: new Date().toISOString() } : n
      )
    );
    const c = editingContent;
    setEditingId(null);
    start(async () => {
      await onUpdate(id, leadId, c);
    });
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta anotação?")) return;
    setNotes((cur) => cur.filter((n) => n.id !== id));
    start(async () => {
      await onDelete(id, leadId);
    });
  }

  return (
    <section className="editorial-card rounded-3xl p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[10px] uppercase tracking-widest3 text-toffee">Comentários da equipe</h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest2 text-cocoa hover:text-ink transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar comentário
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-5 border border-cocoa/15 rounded-2xl p-4 bg-porcelain/50">
          <textarea
            autoFocus
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            placeholder="Ex: liguei e a paciente vai retornar até sexta..."
            className="w-full bg-transparent outline-none text-ink text-sm leading-relaxed resize-none"
          />
          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => { setAdding(false); setNewContent(""); }}
              className="text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-cocoa transition-colors px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={add}
              disabled={pending || !newContent.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-4 py-2 text-[11px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Salvar
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 && !adding ? (
        <p className="text-sm text-ink/45 italic">Nenhum comentário ainda. Use o botão acima pra registrar contatos e observações.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => {
            const isEditing = editingId === n.id;
            const wasEdited = new Date(n.updated_at).getTime() - new Date(n.created_at).getTime() > 1000;
            return (
              <li key={n.id} className="border-l-2 border-cocoa/30 pl-4 py-1 group">
                {isEditing ? (
                  <>
                    <textarea
                      autoFocus
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={4}
                      className="w-full bg-porcelain/60 border border-cocoa/15 rounded-xl p-3 outline-none text-ink text-sm leading-relaxed resize-none focus:border-cocoa"
                    />
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-cocoa px-3 py-1"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => save(n.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-4 py-1.5 text-[11px] uppercase tracking-widest2 hover:bg-ink disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Salvar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[10px] uppercase tracking-widest2 text-ink/45 flex items-center gap-2 mb-1.5">
                      <span>
                        {format(new Date(n.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                      {wasEdited && <span className="italic normal-case tracking-normal">· editada {format(new Date(n.updated_at), "dd MMM HH:mm", { locale: ptBR })}</span>}
                      {n.author?.name || n.author?.email ? (
                        <span className="italic normal-case tracking-normal">· {n.author.name || n.author.email}</span>
                      ) : null}
                      <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setEditingId(n.id); setEditingContent(n.content); }}
                          className="p-1 text-ink/55 hover:text-cocoa"
                          aria-label="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(n.id)}
                          className="p-1 text-ink/55 hover:text-red-700"
                          aria-label="Excluir"
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
