"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import { GripVertical, ExternalLink } from "lucide-react";
import type { Lead, LeadFase } from "@/lib/supabase/types";
import { TEMP_BADGE } from "@/lib/crmStatus";

type LeadLite = Pick<
  Lead,
  "id" | "nome" | "whatsapp" | "interesse" | "urgencia" | "temperatura" | "fase" | "created_at" | "source"
>;

const COLUNAS: { v: LeadFase; l: string; desc: string }[] = [
  { v: "novo", l: "Novo", desc: "Acabou de chegar" },
  { v: "contatado", l: "Contatado", desc: "Já abordado pelo WhatsApp" },
  { v: "agendado", l: "Agendado", desc: "Consulta marcada" },
  { v: "compareceu", l: "Compareceu", desc: "Veio à avaliação" },
  { v: "convertido", l: "Convertido", desc: "Iniciou tratamento" },
  { v: "perdido", l: "Perdido", desc: "Não respondeu ou desistiu" },
];

export function KanbanBoard({
  initialLeads,
  onMove,
}: {
  initialLeads: LeadLite[];
  onMove: (id: string, fase: LeadFase) => Promise<void>;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverFase, setHoverFase] = useState<LeadFase | null>(null);
  const [, start] = useTransition();

  function onDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
  function onDragOver(e: React.DragEvent, fase: LeadFase) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (hoverFase !== fase) setHoverFase(fase);
  }
  function onDragLeave() {
    setHoverFase(null);
  }
  function onDrop(e: React.DragEvent, fase: LeadFase) {
    e.preventDefault();
    setHoverFase(null);
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.fase === fase) return;
    // optimistic
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, fase } : l)));
    start(async () => {
      try {
        await onMove(id, fase);
      } catch {
        setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, fase: lead.fase } : l)));
      }
    });
  }

  return (
    <div className="grid gap-4 grid-flow-col auto-cols-[minmax(280px,1fr)] overflow-x-auto pb-6">
      {COLUNAS.map((col) => {
        const items = leads.filter((l) => l.fase === col.v);
        const isHover = hoverFase === col.v;
        return (
          <div
            key={col.v}
            onDragOver={(e) => onDragOver(e, col.v)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, col.v)}
            className={`rounded-3xl border transition-colors ${
              isHover ? "border-cocoa bg-cocoa/5" : "border-cocoa/10 bg-porcelain/50"
            }`}
          >
            <div className="px-4 pt-4 pb-3 border-b border-cocoa/10 flex items-baseline justify-between">
              <div>
                <div className="font-display text-lg text-ink leading-none">{col.l}</div>
                <div className="text-[10px] uppercase tracking-widest3 text-ink/70 mt-1">
                  {col.desc}
                </div>
              </div>
              <span className="text-[11px] uppercase tracking-widest2 text-cocoa">
                {items.length.toString().padStart(2, "0")}
              </span>
            </div>
            <div className="p-3 space-y-2 min-h-[160px] max-h-[70vh] overflow-y-auto">
              {items.length === 0 && (
                <div className="text-[11px] text-ink/60 text-center py-8">
                  Solte cartões aqui
                </div>
              )}
              {items.map((l) => (
                <div
                  key={l.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, l.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`group relative bg-porcelain rounded-2xl p-4 border border-cocoa/10 cursor-grab active:cursor-grabbing transition-all ${
                    draggingId === l.id ? "opacity-30" : "hover:border-cocoa/40 hover:shadow-md"
                  }`}
                >
                  <GripVertical className="absolute top-2.5 right-2 h-3.5 w-3.5 text-ink/25 group-hover:text-cocoa/70" />
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/admin/crm/leads/${l.id}`}
                      className="font-display text-base text-ink truncate hover:text-cocoa transition-colors"
                    >
                      {l.nome}
                    </Link>
                  </div>
                  <div className="text-[11px] text-ink/70 mb-2 truncate">
                    {l.whatsapp}
                  </div>
                  {l.interesse && (
                    <div className="text-[11px] text-cocoa/85 italic mb-2 truncate">
                      {l.interesse}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-cocoa/10">
                    <span className={`text-[9px] uppercase tracking-widest2 px-2 py-0.5 rounded-full ${TEMP_BADGE[l.temperatura]}`}>
                      {l.temperatura}
                    </span>
                    <span className="text-[10px] text-ink/70 ml-auto">
                      {format(new Date(l.created_at), "dd MMM", { locale: ptBR })}
                    </span>
                    <Link
                      href={`/admin/crm/leads/${l.id}`}
                      className="text-cocoa hover:text-ink"
                      aria-label="Abrir lead"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
