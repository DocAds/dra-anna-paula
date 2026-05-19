"use client";

import { useTransition } from "react";
import type { Lead, LeadFase, LeadTemperatura } from "@/lib/supabase/types";

const FASES: { v: LeadFase; l: string; help: string }[] = [
  { v: "novo", l: "Novo", help: "Lead acabou de chegar, ainda não contatado" },
  { v: "contatado", l: "Contatado", help: "Já entrei em contato pelo WhatsApp" },
  { v: "agendado", l: "Agendado", help: "Consulta marcada na agenda" },
  { v: "compareceu", l: "Compareceu", help: "Compareceu à avaliação" },
  { v: "convertido", l: "Convertido", help: "Iniciou tratamento na clínica" },
  { v: "perdido", l: "Perdido", help: "Não respondeu ou desistiu" },
];

const TEMPS: { v: LeadTemperatura; l: string; help: string }[] = [
  { v: "frio", l: "Frio", help: "Sem pressa, ainda em consideração" },
  { v: "morno", l: "Morno", help: "Tem interesse mas vai pensar" },
  { v: "quente", l: "Quente", help: "Urgência alta, decidir essa semana" },
];

export function LeadActions({
  lead,
  onSave,
  onDelete,
}: {
  lead: Lead;
  onSave: (fd: FormData) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [pending, start] = useTransition();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      await onSave(fd);
    });
  }

  async function confirmDelete() {
    if (!confirm("Excluir este lead? Não dá pra desfazer.")) return;
    start(async () => {
      await onDelete();
    });
  }

  return (
    <aside className="space-y-4">
      <form onSubmit={submit} className="editorial-card rounded-3xl p-6 space-y-5">
        <div>
          <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">Fase do atendimento</div>
          <select
            name="fase"
            defaultValue={lead.fase}
            className="w-full bg-transparent border border-cocoa/20 rounded-full px-4 py-2 text-sm text-ink"
          >
            {FASES.map((f) => (
              <option key={f.v} value={f.v}>{f.l}</option>
            ))}
          </select>
          <div className="text-[10px] text-ink/45 mt-2">
            {FASES.find((f) => f.v === lead.fase)?.help}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">Temperatura</div>
          <select
            name="temperatura"
            defaultValue={lead.temperatura}
            className="w-full bg-transparent border border-cocoa/20 rounded-full px-4 py-2 text-sm text-ink"
          >
            {TEMPS.map((t) => (
              <option key={t.v} value={t.v}>{t.l}</option>
            ))}
          </select>
          <div className="text-[10px] text-ink/45 mt-2">
            {TEMPS.find((t) => t.v === lead.temperatura)?.help}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">Cidade</div>
          <input
            name="cidade"
            defaultValue={lead.cidade || ""}
            placeholder="Ex: São Paulo"
            className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-2 text-ink text-sm"
          />
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">Anotações internas</div>
          <textarea
            name="notas"
            rows={6}
            defaultValue={lead.notas || ""}
            placeholder="Anotações da equipe: ligações feitas, observações, próximos passos..."
            className="w-full bg-transparent border border-cocoa/15 rounded-2xl p-3 text-ink text-sm resize-none focus:border-cocoa outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-cocoa text-bone py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <button
        type="button"
        onClick={confirmDelete}
        disabled={pending}
        className="w-full text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-red-700 transition-colors py-3"
      >
        Excluir lead
      </button>
    </aside>
  );
}
