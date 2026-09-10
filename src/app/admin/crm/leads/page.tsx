import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, List, Trello, Search, AlertCircle } from "lucide-react";
import type { Lead } from "@/lib/supabase/types";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { moveLeadFase } from "../actions";
import {
  FASE_BADGE,
  TEMP_BADGE,
  FASE_LABEL,
  TEMP_LABEL,
  FASES_ORDEM,
} from "@/lib/crmStatus";
import { CANAIS_ORDEM, CANAL_LABEL } from "@/lib/leadOrigem";
import {
  aplicaFiltros,
  descreveFiltros,
  filtrosParaQuery,
  parseFiltros,
  temFiltroAtivo,
  umValor,
  type FiltrosLead,
  type LeadsSearchParams,
} from "@/lib/leadFiltros";
import { formataDiaHoraSP } from "@/lib/dataSP";
import { mascaraTelefone } from "@/lib/leadWhatsapp";
import { requireSection } from "@/lib/admin-guard";
import { SeletorPeriodo } from "./SeletorPeriodo";
import { BotaoWhatsapp } from "./BotaoWhatsapp";
import { SeloOrigem } from "./SeloOrigem";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;
const KANBAN_LIMIT = 500;

// Só as colunas que a tela usa. select('*') traz mensagem, user_agent e notas em
// toda listagem, que é payload puro sem ninguém ler.
const COLUNAS_LISTA =
  "id,nome,whatsapp,whatsapp_country,email,interesse,urgencia,temperatura,fase,created_at,source,canal,utm_source,utm_medium,utm_campaign,gclid,fbclid,referrer";

const plural = (n: number) => (n === 1 ? "lead" : "leads");

const ROTULOS = { fase: FASE_LABEL, canal: CANAL_LABEL, temperatura: TEMP_LABEL };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<LeadsSearchParams>;
}) {
  await requireSection("leads");
  const sp = await searchParams;
  const view = umValor(sp.view) === "lista" ? "lista" : "kanban";
  const filtros = parseFiltros(sp);
  const temFiltro = temFiltroAtivo(filtros);
  const page = Math.max(1, Number.parseInt(umValor(sp.page) ?? "1", 10) || 1);
  const sb = await createClient();

  // Preserva o recorte inteiro ao alternar entre lista e kanban.
  const baseQuery = filtrosParaQuery(filtros);

  // As três consultas não dependem uma da outra: em série, a tela esperava a
  // soma dos três tempos de ida e volta ao banco.
  const [resultado, geral, interesses] = await Promise.all([
    view === "kanban"
      ? aplicaFiltros(sb.from("leads").select(COLUNAS_LISTA, { count: "exact" }), filtros)
          .order("created_at", { ascending: false })
          .limit(KANBAN_LIMIT)
          .returns<Lead[]>()
      : aplicaFiltros(sb.from("leads").select(COLUNAS_LISTA, { count: "exact" }), filtros)
          .order("created_at", { ascending: false })
          .range((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE - 1)
          .returns<Lead[]>(),
    sb.from("leads").select("id", { count: "exact", head: true }),
    // Valores distintos saem da view (migration 008). Deduplicar no servidor
    // sobre as primeiras N linhas cortava no alfabeto: interesse que só
    // aparecia lá embaixo sumia do filtro.
    sb.from("leads_interesses").select("interesse").returns<{ interesse: string }[]>(),
  ]);

  const leads: Lead[] = resultado.data ?? [];
  // No kanban o count é o tamanho real do recorte; leads.length é só o que
  // coube no teto. Sem essa distinção a tela dizia "500 leads" tanto para 500
  // quanto para 4 mil.
  const total = resultado.count ?? leads.length;
  const totalGeral = geral.count ?? 0;
  const truncado = view === "kanban" && total > leads.length;

  let erroDeCarga: string | null = null;
  if (resultado.error) {
    console.error("[leads] falha na consulta", {
      code: resultado.error.code,
      message: resultado.error.message,
      hint: resultado.error.hint,
    });
    // Só o código vai para a tela: a mensagem do Postgres descreve a estrutura
    // interna do banco.
    erroDeCarga = resultado.error.code ?? "erro";
  }

  const opcoesDeInteresse = [
    ...new Set((interesses.data ?? []).map((i) => i.interesse).filter(Boolean)),
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Página além do fim (filtro aplicado enquanto se navegava, ou URL montada à
  // mão) devolvia lista vazia com cara de "nenhum lead", sem link de volta.
  if (view === "lista" && page > totalPages && total > 0) {
    redirect(
      `/admin/crm/leads?${new URLSearchParams({ view: "lista", ...baseQuery, page: String(totalPages) }).toString()}`
    );
  }

  const subtitulo = erroDeCarga
    ? "não foi possível carregar"
    : truncado
      ? `mostrando os ${leads.length} mais recentes de ${total}`
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
          {truncado && (
            <p className="text-[11px] uppercase tracking-widest2 text-cocoa mt-1">
              Refine o filtro para ver o resto
            </p>
          )}
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

      {!erroDeCarga && (
        <BarraDeFiltros
          filtros={filtros}
          view={view}
          interesses={opcoesDeInteresse}
          temFiltro={temFiltro}
          mostrando={leads.length}
          total={total}
          totalGeral={totalGeral}
        />
      )}

      {erroDeCarga ? (
        <div role="alert" className="editorial-card rounded-3xl p-8 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-display text-xl text-ink">Não deu para carregar os leads.</p>
            <p className="text-sm text-ink/65 mt-1">
              {erroDeCarga === "42703" || erroDeCarga === "PGRST204"
                ? "O banco ainda não tem as colunas de origem: falta aplicar a migration 008_leads_origem.sql."
                : `A base respondeu com um erro (${erroDeCarga}). Atualize a página; se continuar, o registro completo está no log do servidor.`}
            </p>
          </div>
        </div>
      ) : view === "lista" ? (
        !leads.length ? (
          <EmptyState temFiltro={temFiltro} filtros={filtros} view={view} />
        ) : (
          <>
            <ul className="grid gap-3">
              {leads.map((l) => (
                <li key={l.id}>
                  <article className="relative grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-3 editorial-card rounded-3xl px-6 py-5 transition-all duration-500 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-within:ring-2 focus-within:ring-cocoa/60">
                    <div className="min-w-0">
                      {/* O link é o nome, e o ::after dele é que cobre o cartão:
                          a área de clique continua inteira, o botão de WhatsApp
                          não vira âncora dentro de âncora, e o texto que a
                          equipe precisa copiar (telefone) fica acessível ao
                          cursor com z-10. */}
                      <Link
                        href={`/admin/crm/leads/${l.id}`}
                        className="block font-display text-lg text-ink truncate w-fit max-w-full rounded hover:text-cocoa transition-colors motion-reduce:transition-none after:absolute after:inset-0 after:content-[''] after:rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60"
                      >
                        {l.nome}
                      </Link>
                      <div className="text-[11px] uppercase tracking-widest2 text-ink/70 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span className="relative z-10 select-text">
                          {mascaraTelefone(l.whatsapp, l.whatsapp_country)}
                        </span>
                        {l.interesse && <span>· {l.interesse}</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-2 min-w-0">
                        <SeloOrigem lead={l} />
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
                    <div className="flex items-center gap-3 text-[11px] text-ink/70 whitespace-nowrap">
                      <span className="hidden sm:inline">{formataDiaHoraSP(l.created_at)}</span>
                      <BotaoWhatsapp lead={l} />
                      <ArrowRight className="hidden sm:block h-4 w-4 text-cocoa" aria-hidden />
                    </div>
                  </article>
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
        )
      ) : !leads.length ? (
        <EmptyState temFiltro={temFiltro} filtros={filtros} view={view} />
      ) : (
        <KanbanBoard initialLeads={leads} onMove={moveLeadFase} />
      )}
    </main>
  );
}

function BarraDeFiltros({
  filtros,
  view,
  interesses,
  temFiltro,
  mostrando,
  total,
  totalGeral,
}: {
  filtros: FiltrosLead;
  view: "lista" | "kanban";
  interesses: string[];
  temFiltro: boolean;
  mostrando: number;
  total: number;
  totalGeral: number;
}) {
  const campo =
    "bg-transparent border border-cocoa/15 rounded-full px-4 py-2.5 text-sm text-ink focus:border-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50 transition-colors motion-reduce:transition-none";

  // O valor filtrado entra na lista mesmo que a view ainda não o tenha: sem
  // isso o select mostrava "Todos os interesses" com um filtro ativo.
  const opcoesVisiveis =
    filtros.interesse && !interesses.includes(filtros.interesse)
      ? [filtros.interesse, ...interesses]
      : interesses;

  return (
    <section aria-label="Filtros da lista de leads" className="mb-5 space-y-3">
      {/* O form é GET puro: o recorte vira URL, sobrevive ao F5 e pode ser
          mandado para outra pessoa. */}
      <form className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="view" value={view} />
        {filtros.periodo !== "tudo" && <input type="hidden" name="periodo" value={filtros.periodo} />}
        {filtros.periodo === "personalizado" && filtros.de && (
          <input type="hidden" name="de" value={filtros.de} />
        )}
        {filtros.periodo === "personalizado" && filtros.ate && (
          <input type="hidden" name="ate" value={filtros.ate} />
        )}

        <div className="relative flex-1 min-w-[200px]">
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cocoa/50" />
          <input
            type="search"
            name="q"
            defaultValue={filtros.busca}
            aria-label="Buscar leads por nome, telefone ou e-mail"
            placeholder="Buscar nome, telefone ou e-mail"
            className="w-full bg-transparent border border-cocoa/15 rounded-full pl-11 pr-5 py-2.5 text-sm text-ink placeholder-ink/40 focus:border-cocoa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50 transition-colors"
          />
        </div>

        <select name="fase" defaultValue={filtros.fase || ""} aria-label="Filtrar por fase do atendimento" className={campo}>
          <option value="">Todas as fases</option>
          {FASES_ORDEM.map((f) => (
            <option key={f} value={f}>{FASE_LABEL[f]}</option>
          ))}
        </select>

        <select name="canal" defaultValue={filtros.canal || ""} aria-label="Filtrar por origem do lead" className={campo}>
          <option value="">Todas as origens</option>
          {CANAIS_ORDEM.map((c) => (
            <option key={c} value={c}>{CANAL_LABEL[c]}</option>
          ))}
        </select>

        <select name="temp" defaultValue={filtros.temperatura || ""} aria-label="Filtrar por temperatura" className={campo}>
          <option value="">Toda temperatura</option>
          {(["quente", "morno", "frio"] as const).map((t) => (
            <option key={t} value={t}>{TEMP_LABEL[t]}</option>
          ))}
        </select>

        {/* Só existe select de interesse quando há interesse gravado — filtro
            vazio ocupa espaço e não filtra nada. */}
        {/* Sem select (nenhum interesse gravado ainda), o filtro ativo viaja no
            hidden: sem isso, "Filtrar" apagava em silêncio um recorte que a
            pessoa tinha acabado de aplicar. */}
        {opcoesVisiveis.length > 0 ? (
          <select
            name="interesse"
            defaultValue={filtros.interesse || ""}
            aria-label="Filtrar por interesse"
            className={`${campo} max-w-[14rem] truncate`}
          >
            <option value="">Todos os interesses</option>
            {opcoesVisiveis.map((i) => (
              <option key={i} value={i}>
                {i.length > 32 ? `${i.slice(0, 31)}…` : i}
              </option>
            ))}
          </select>
        ) : (
          filtros.interesse && <input type="hidden" name="interesse" value={filtros.interesse} />
        )}

        <button className="rounded-full bg-cocoa text-bone px-5 py-2.5 text-[11px] uppercase tracking-widest2 hover:bg-ink transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60">
          Filtrar
        </button>

        {temFiltro && (
          <Link
            href={{ pathname: "/admin/crm/leads", query: { view } }}
            className="text-[11px] uppercase tracking-widest2 text-ink/60 hover:text-cocoa transition-colors px-2 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60 rounded-full"
          >
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeletorPeriodo
          periodo={filtros.periodo}
          de={filtros.de}
          ate={filtros.ate}
          queryBase={{
            view,
            ...filtrosParaQuery({ ...filtros, periodo: "tudo", de: undefined, ate: undefined }),
          }}
        />
        <p aria-live="polite" className="text-[11px] uppercase tracking-widest2 text-ink/70">
          {temFiltro
            ? `Mostrando ${mostrando} de ${total} ${plural(total)} filtrados · ${totalGeral} na base`
            : `Mostrando ${mostrando} de ${totalGeral} ${plural(totalGeral)}`}
        </p>
      </div>
    </section>
  );
}

function EmptyState({
  temFiltro,
  filtros,
  view,
}: {
  temFiltro: boolean;
  filtros: FiltrosLead;
  view: "lista" | "kanban";
}) {
  if (temFiltro) {
    const alvo = descreveFiltros(filtros, ROTULOS);
    return (
      <div className="editorial-card rounded-3xl p-12 text-center">
        <p className="font-display text-2xl text-ink">Nenhum lead com esse recorte.</p>
        {alvo && <p className="text-sm text-ink/65 mt-2">Filtro aplicado: {alvo}.</p>}
        <Link
          href={{ pathname: "/admin/crm/leads", query: { view } }}
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
