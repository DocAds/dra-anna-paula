import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, List, Trello } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import type { Lead } from "@/lib/supabase/types";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { moveLeadFase } from "../actions";
import { FASE_BADGE, TEMP_BADGE } from "@/lib/crmStatus";
import { requireSection } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const FASES = ["novo", "contatado", "agendado", "compareceu", "convertido", "perdido"] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string; q?: string; view?: string }>;
}) {
  await requireSection("leads");
  const sp = await searchParams;
  const view = sp.view === "lista" ? "lista" : "kanban";
  const sb = await createClient();

  let q = sb.from("leads").select("*").order("created_at", { ascending: false });
  if (view === "lista" && sp.fase && FASES.includes(sp.fase as (typeof FASES)[number])) {
    q = q.eq("fase", sp.fase);
  }
  if (sp.q) {
    q = q.or(`nome.ilike.%${sp.q}%,whatsapp.ilike.%${sp.q}%,email.ilike.%${sp.q}%`);
  }
  const { data: leads } = await q.returns<Lead[]>();

  return (
    <main className="p-8 md:p-12">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest3 text-cocoa mb-3">CRM</div>
          <h1 className="font-display text-4xl text-ink leading-tight">Leads</h1>
          <p className="text-sm text-ink/70 mt-2">
            {(leads?.length || 0).toString().padStart(2, "0")} leads no total.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-cocoa/15 p-1 bg-porcelain/60">
          <Link
            href={{ pathname: "/admin/crm/leads", query: { view: "lista", ...(sp.q ? { q: sp.q } : {}) } }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-widest2 transition-colors ${
              view === "lista" ? "bg-cocoa text-bone" : "text-ink/65 hover:text-cocoa"
            }`}
          >
            <List className="h-3.5 w-3.5" /> Lista
          </Link>
          <Link
            href={{ pathname: "/admin/crm/leads", query: { view: "kanban", ...(sp.q ? { q: sp.q } : {}) } }}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-widest2 transition-colors ${
              view === "kanban" ? "bg-cocoa text-bone" : "text-ink/65 hover:text-cocoa"
            }`}
          >
            <Trello className="h-3.5 w-3.5" /> Kanban
          </Link>
        </div>
      </div>

      {view === "lista" ? (
        <>
          <form className="mb-4 flex flex-wrap items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={sp.q || ""}
              placeholder="Buscar nome, telefone ou e-mail"
              className="flex-1 min-w-[200px] bg-transparent border border-cocoa/15 rounded-full px-5 py-2.5 text-sm text-ink focus:border-cocoa outline-none"
            />
            <select
              name="fase"
              defaultValue={sp.fase || ""}
              className="bg-transparent border border-cocoa/15 rounded-full px-4 py-2.5 text-sm text-ink"
            >
              <option value="">Todas as fases</option>
              {FASES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <button className="rounded-full bg-cocoa text-bone px-5 py-2.5 text-[11px] uppercase tracking-widest2">
              Filtrar
            </button>
          </form>

          {!leads?.length ? (
            <div className="editorial-card rounded-3xl p-10 text-center text-ink/70">
              Nenhum lead {sp.fase ? `na fase ${sp.fase}` : "ainda"}.
            </div>
          ) : (
            <ul className="grid gap-3">
              {leads.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/admin/crm/leads/${l.id}`}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 editorial-card rounded-3xl px-6 py-5 hover:-translate-y-0.5 transition-all duration-500"
                  >
                    <div className="min-w-0">
                      <div className="font-display text-lg text-ink truncate">{l.nome}</div>
                      <div className="text-[11px] uppercase tracking-widest2 text-ink/70 mt-1 flex flex-wrap gap-3">
                        <span>{l.whatsapp}</span>
                        {l.interesse && <span>· {l.interesse}</span>}
                        {l.source && <span>· {l.source}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${TEMP_BADGE[l.temperatura]}`}>
                      {l.temperatura}
                    </span>
                    <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${FASE_BADGE[l.fase]}`}>
                      {l.fase}
                    </span>
                    <div className="hidden sm:flex items-center gap-3 text-[11px] text-ink/70">
                      <span>{format(new Date(l.created_at), "dd MMM HH:mm", { locale: ptBR })}</span>
                      <ArrowRight className="h-4 w-4 text-cocoa" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <KanbanBoard initialLeads={leads || []} onMove={moveLeadFase} />
      )}
    </main>
  );
}
