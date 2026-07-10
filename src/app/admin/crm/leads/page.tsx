import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, List, Trello, Search } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import type { Lead, LeadFase } from "@/lib/supabase/types";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { moveLeadFase } from "../actions";
import { FASE_BADGE, TEMP_BADGE, FASE_LABEL, TEMP_LABEL, FASES_ORDEM } from "@/lib/crmStatus";
import { requireSection } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;
const KANBAN_LIMIT = 500;

const isFase = (v: string | undefined): v is LeadFase =>
  !!v && (FASES_ORDEM as string[]).includes(v);

const plural = (n: number) => (n === 1 ? "lead" : "leads");

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string; q?: string; view?: string; page?: string }>;
}) {
  await requireSection("leads");
  const sp = await searchParams;
  const view = sp.view === "lista" ? "lista" : "kanban";
  const busca = sp.q?.trim() || "";
  const fase = isFase(sp.fase) ? sp.fase : undefined;
  const temFiltro = Boolean(busca || fase);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const sb = await createClient();

  // Preserva busca/fase ao alternar entre lista e kanban.
  const baseQuery = { ...(busca ? { q: busca } : {}), ...(fase ? { fase } : {}) };

  let leads: Lead[] = [];
  let total = 0;
  if (view === "kanban") {
    const { data } = await sb
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(KANBAN_LIMIT)
      .returns<Lead[]>();
    leads = data ?? [];
    total = leads.length;
  } else {
    let q = sb.from("leads").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (fase) q = q.eq("fase", fase);
    if (busca) q = q.or(`nome.ilike.%${busca}%,whatsapp.ilike.%${busca}%,email.ilike.%${busca}%`);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await q.range(from, from + PAGE_SIZE - 1).returns<Lead[]>();
    leads = data ?? [];
    total = count ?? 0;
  }
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const subtitulo =
    view === "kanban"
      ? `${total} ${plural(total)}${total === KANBAN_LIMIT ? " mais recentes" : ""}`
      : temFiltro
        ? `${total} ${plural(total)} ${total === 1 ? "encontrado" : "encontrados"}`
        : `${total} ${plural(total)} no total`;

  return (
    <main className="p-8 md:p-12">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest3 text-cocoa mb-3">CRM</div>
          <h1 className="font-display text-4xl text-ink leading-tight">Leads</h1>
          <p className="text-sm text-ink/70 mt-2">{subtitulo}.</p>
        </div>
        <div className="inline-flex rounded-full border border-cocoa/15 p-1 bg-porcelain/60">
          <Link
            href={{ pathname: "/admin/crm/leads", query: { view: "lista", ...baseQuery } }}
            aria-current={view === "lista" ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-widest2 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60 ${
              view === "lista" ? "bg-cocoa text-bone" : "text-ink/70 hover:text-cocoa"
            }`}
          >
            <List className="h-3.5 w-3.5" /> Lista
          </Link>
          <Link
            href={{ pathname: "/admin/crm/leads", query: { view: "kanban", ...baseQuery } }}
            aria-current={view === "kanban" ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-widest2 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60 ${
              view === "kanban" ? "bg-cocoa text-bone" : "text-ink/70 hover:text-cocoa"
            }`}
          >
            <Trello className="h-3.5 w-3.5" /> Kanban
          </Link>
        </div>
      </div>

      {view === "lista" ? (
        <>
          <form className="mb-4 flex flex-wrap items-center gap-2">
            <input type="hidden" name="view" value="lista" />
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cocoa/50" />
              <input
                type="search"
                name="q"
                defaultValue={busca}
                aria-label="Buscar leads por nome, telefone ou e-mail"
                placeholder="Buscar nome, telefone ou e-mail"
                className="w-full bg-transparent border border-cocoa/15 rounded-full pl-11 pr-5 py-2.5 text-sm text-ink placeholder-ink/40 focus:border-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50 transition-colors"
              />
            </div>
            <select
              name="fase"
              defaultValue={fase || ""}
              aria-label="Filtrar por fase do atendimento"
              className="bg-transparent border border-cocoa/15 rounded-full px-4 py-2.5 text-sm text-ink focus:border-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50 transition-colors"
            >
              <option value="">Todas as fases</option>
              {FASES_ORDEM.map((f) => (
                <option key={f} value={f}>{FASE_LABEL[f]}</option>
              ))}
            </select>
            <button className="rounded-full bg-cocoa text-bone px-5 py-2.5 text-[11px] uppercase tracking-widest2 hover:bg-ink transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60">
              Filtrar
            </button>
            {temFiltro && (
              <Link
                href="/admin/crm/leads?view=lista"
                className="text-[11px] uppercase tracking-widest2 text-ink/60 hover:text-cocoa transition-colors px-2 py-2.5"
              >
                Limpar
              </Link>
            )}
          </form>

          {!leads.length ? (
            <EmptyState temFiltro={temFiltro} fase={fase} busca={busca} />
          ) : (
            <>
              <ul className="grid gap-3">
                {leads.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/admin/crm/leads/${l.id}`}
                      className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-3 editorial-card rounded-3xl px-6 py-5 hover:-translate-y-0.5 transition-all duration-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60"
                    >
                      <div className="min-w-0">
                        <div className="font-display text-lg text-ink truncate">{l.nome}</div>
                        <div className="text-[11px] uppercase tracking-widest2 text-ink/70 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span>{l.whatsapp}</span>
                          {l.interesse && <span>· {l.interesse}</span>}
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex flex-wrap items-center gap-2 order-last sm:order-none">
                        <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${TEMP_BADGE[l.temperatura]}`}>
                          {TEMP_LABEL[l.temperatura]}
                        </span>
                        <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${FASE_BADGE[l.fase]}`}>
                          {FASE_LABEL[l.fase]}
                        </span>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-[11px] text-ink/70 whitespace-nowrap">
                        <span>{format(new Date(l.created_at), "dd MMM HH:mm", { locale: ptBR })}</span>
                        <ArrowRight className="h-4 w-4 text-cocoa" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav className="flex items-center justify-between gap-4 mt-6" aria-label="Paginação de leads">
                  <PagerLink
                    disabled={page <= 1}
                    query={{ view: "lista", ...baseQuery, page: String(page - 1) }}
                  >
                    ← Anterior
                  </PagerLink>
                  <span className="text-[11px] uppercase tracking-widest2 text-ink/60">
                    Página {page} de {totalPages}
                  </span>
                  <PagerLink
                    disabled={page >= totalPages}
                    query={{ view: "lista", ...baseQuery, page: String(page + 1) }}
                  >
                    Próxima →
                  </PagerLink>
                </nav>
              )}
            </>
          )}
        </>
      ) : (
        <KanbanBoard initialLeads={leads} onMove={moveLeadFase} />
      )}
    </main>
  );
}

function EmptyState({
  temFiltro,
  fase,
  busca,
}: {
  temFiltro: boolean;
  fase?: LeadFase;
  busca: string;
}) {
  if (temFiltro) {
    const alvo = busca
      ? `para "${busca}"`
      : fase
        ? `na fase ${FASE_LABEL[fase]}`
        : "para este filtro";
    return (
      <div className="editorial-card rounded-3xl p-12 text-center">
        <p className="font-display text-2xl text-ink">Nenhum lead {alvo}.</p>
        <p className="text-sm text-ink/65 mt-2">Tente outra busca ou remova o filtro.</p>
        <Link
          href="/admin/crm/leads?view=lista"
          className="inline-flex mt-6 rounded-full bg-cocoa text-bone px-5 py-2.5 text-[11px] uppercase tracking-widest2 hover:bg-ink transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60"
        >
          Limpar filtros
        </Link>
      </div>
    );
  }
  return (
    <div className="editorial-card rounded-3xl p-12 text-center">
      <p className="font-display text-2xl text-ink">Ainda não chegou nenhum lead.</p>
      <p className="text-sm text-ink/65 mt-2 max-w-md mx-auto leading-relaxed">
        Assim que alguém pedir contato pelo site, seja pelo formulário ou por um botão de
        WhatsApp, o lead aparece aqui com a origem e o interesse já registrados.
      </p>
    </div>
  );
}

function PagerLink({
  disabled,
  query,
  children,
}: {
  disabled: boolean;
  query: Record<string, string>;
  children: React.ReactNode;
}) {
  const cls =
    "rounded-full border border-cocoa/20 px-5 py-2.5 text-[11px] uppercase tracking-widest2 transition-colors motion-reduce:transition-none";
  if (disabled) {
    return (
      <span aria-disabled className={`${cls} text-ink/30 border-cocoa/10 cursor-not-allowed`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={{ pathname: "/admin/crm/leads", query }}
      className={`${cls} text-ink/70 hover:text-cocoa hover:border-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60`}
    >
      {children}
    </Link>
  );
}
