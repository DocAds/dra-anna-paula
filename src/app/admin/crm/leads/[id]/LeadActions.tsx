"use client";

import { useState, useTransition } from "react";
import { Check, AlertCircle } from "lucide-react";
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

const fieldBase =
  "w-full bg-transparent border border-cocoa/20 rounded-full px-4 py-2 text-sm text-ink focus:border-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50 transition-colors";

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
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [fase, setFase] = useState<LeadFase>(lead.fase);
  const [temperatura, setTemperatura] = useState<LeadTemperatura>(lead.temperatura);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("idle");
    start(async () => {
      try {
        await onSave(fd);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    });
  }

  async function confirmDelete() {
    if (!confirm("Excluir este lead? Não dá pra desfazer.")) return;
    setStatus("idle");
    start(async () => {
      try {
        await onDelete();
        // sucesso navega para a lista (redirect na server action)
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <aside className="space-y-4">
      <form onSubmit={submit} className="editorial-card rounded-3xl p-6 space-y-5">
        <div>
          <label htmlFor="lead-fase" className="block text-[10px] uppercase tracking-widest3 text-cocoa mb-2">
            Fase do atendimento
          </label>
          <select
            id="lead-fase"
            name="fase"
            value={fase}
            onChange={(e) => setFase(e.target.value as LeadFase)}
            className={fieldBase}
          >
            {FASES.map((f) => (
              <option key={f.v} value={f.v}>{f.l}</option>
            ))}
          </select>
          <div className="text-[10px] text-ink/70 mt-2">
            {FASES.find((f) => f.v === fase)?.help}
          </div>
        </div>

        <div>
          <label htmlFor="lead-temp" className="block text-[10px] uppercase tracking-widest3 text-cocoa mb-2">
            Temperatura
          </label>
          <select
            id="lead-temp"
            name="temperatura"
            value={temperatura}
            onChange={(e) => setTemperatura(e.target.value as LeadTemperatura)}
            className={fieldBase}
          >
            {TEMPS.map((t) => (
              <option key={t.v} value={t.v}>{t.l}</option>
            ))}
          </select>
          <div className="text-[10px] text-ink/70 mt-2">
            {TEMPS.find((t) => t.v === temperatura)?.help}
          </div>
        </div>

        <div>
          <label htmlFor="lead-cidade" className="block text-[10px] uppercase tracking-widest3 text-cocoa mb-2">
            Cidade
          </label>
          <input
            id="lead-cidade"
            name="cidade"
            defaultValue={lead.cidade || ""}
            placeholder="Ex: São Paulo"
            className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa focus-visible:outline-none outline-none py-2 text-ink text-sm transition-colors"
          />
        </div>

        <div>
          <label htmlFor="lead-notas" className="block text-[10px] uppercase tracking-widest3 text-cocoa mb-2">
            Anotações internas
          </label>
          <textarea
            id="lead-notas"
            name="notas"
            rows={6}
            defaultValue={lead.notas || ""}
            placeholder="Comentários da equipe: ligações feitas, observações, próximos passos..."
            className="w-full bg-transparent border border-cocoa/15 rounded-2xl p-3 text-ink text-sm resize-none focus:border-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/40 transition-colors"
          />
        </div>

        {status === "error" && (
          <p role="alert" className="flex items-center gap-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Não foi possível salvar. Tente de novo em instantes.
          </p>
        )}
        {status === "saved" && (
          <p role="status" className="flex items-center gap-2 text-sm text-emerald-700">
            <Check className="h-4 w-4 shrink-0" />
            Alterações salvas.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-cocoa text-bone py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors motion-reduce:transition-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <button
        type="button"
        onClick={confirmDelete}
        disabled={pending}
        className="w-full text-[11px] uppercase tracking-widest2 text-ink/70 hover:text-rose-700 transition-colors motion-reduce:transition-none py-3 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 rounded-full"
      >
        Excluir lead
      </button>
    </aside>
  );
}
