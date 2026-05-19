import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "./KanbanBoard";
import { moveLeadFase } from "../actions";
import type { Lead } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const sb = await createClient();
  const { data: leads = [] } = await sb
    .from("leads")
    .select("id, nome, whatsapp, interesse, urgencia, temperatura, fase, created_at, source")
    .order("created_at", { ascending: false })
    .returns<Pick<Lead, "id" | "nome" | "whatsapp" | "interesse" | "urgencia" | "temperatura" | "fase" | "created_at" | "source">[]>();

  return (
    <main className="p-8 md:p-12">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-3">CRM</div>
        <h1 className="font-display text-4xl text-ink leading-tight">Kanban de leads</h1>
        <p className="text-sm text-ink/55 mt-2">
          Arraste os cartões entre as colunas pra atualizar a fase do atendimento.
        </p>
      </div>
      <KanbanBoard initialLeads={leads || []} onMove={moveLeadFase} />
    </main>
  );
}
