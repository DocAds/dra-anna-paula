import Link from "next/link";
import { AlertCircle, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/admin-guard";
import {
  CANAIS_ORDEM,
  CANAL_BADGE,
  CANAL_LABEL,
  isCanal,
  type CanalLead,
} from "@/lib/leadOrigem";
import {
  filtrosParaQuery,
  intervaloDoPeriodo,
  parseFiltros,
  type FiltrosLead,
  type LeadsSearchParams,
} from "@/lib/leadFiltros";
import { formataDiaSP } from "@/lib/dataSP";
import { SeletorPeriodo } from "../leads/SeletorPeriodo";

export const dynamic = "force-dynamic";

const PATHNAME = "/admin/crm/origem";

// Teto da varredura por lead. O bloco de criativos não tem view: ele conta
// linha a linha, e sem limite explícito a tela cresce junto com a base até o
// dia em que passa do tempo do Worker sem avisar ninguém.
const LIMITE_LEADS = 2000;

const COLUNAS_ORIGEM =
  "canal,utm_campaign,campaign_id,utm_content,utm_term,fase,created_at";

const SEM_CAMPANHA = "(sem campanha)";

// Mesmo conjunto de fases do `count(*) filter` da view (migration 010). Mudou
// lá, muda aqui, senão os dois blocos da mesma tela discordam sobre o que é um
// lead que avançou.
const FASES_AGENDADO = new Set(["agendado", "compareceu", "convertido"]);

type LinhaDaView = {
  canal: string | null;
  campanha: string | null;
  leads: number | null;
  agendados: number | null;
  convertidos: number | null;
  primeiro: string | null;
  ultimo: string | null;
};

type LeadCru = {
  canal: string | null;
  utm_campaign: string | null;
  campaign_id: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fase: string;
  created_at: string;
};

type Linha = {
  canal: CanalLead;
  /** Campanha, no bloco de campanhas; utm_content, no de criativos. */
  a: string;
  /** Vazio no bloco de campanhas; utm_term, no de criativos. */
  b: string;
  leads: number;
  agendados: number;
  convertidos: number;
  primeiro: string | null;
  ultimo: string | null;
};

// utm_content e utm_term não querem dizer a mesma coisa nas duas plataformas, e
// o rótulo fixo mente: na Meta não existe palavra-chave, e chamar o conjunto de
// anúncios de "Palavra-chave" faz o gestor procurar um lance que não existe.
const ROTULOS_UTM: Partial<Record<CanalLead, { a: string; b: string }>> = {
  "meta-ads": { a: "Anúncio", b: "Conjunto" },
  "google-ads": { a: "ID do anúncio", b: "Palavra-chave" },
};

const rotulosUtm = (c: CanalLead) =>
  ROTULOS_UTM[c] ?? { a: "Conteúdo (utm_content)", b: "Termo (utm_term)" };

// O canal já vem gravado na linha desde a migration 008. Reclassificar aqui
// pela cascata de leadOrigem faria esta tela divergir da view, que só sabe ler
// a coluna.
const canalGravado = (v: string | null): CanalLead =>
  isCanal(v) ? v : "nao-identificado";

// Mesma regra do coalesce da view, para os dois caminhos de contagem chegarem
// ao mesmo nome de campanha.
const campanhaDoLead = (l: LeadCru) =>
  l.utm_campaign?.trim() || l.campaign_id?.trim() || SEM_CAMPANHA;

const taxaDeAvanco = (l: Linha) =>
  l.leads > 0 ? Math.round((l.agendados / l.leads) * 100) : 0;

/** Ordena por canal (dinheiro primeiro) e, dentro dele, por volume. */
function ordena(linhas: Linha[]): Linha[] {
  return [...linhas].sort((x, y) => {
    const canal = CANAIS_ORDEM.indexOf(x.canal) - CANAIS_ORDEM.indexOf(y.canal);
    if (canal !== 0) return canal;
    if (y.leads !== x.leads) return y.leads - x.leads;
    return y.convertidos - x.convertidos;
  });
}

/**
 * Agrupa os leads carregados pela chave devolvida em `chave`.
 * Devolver null descarta a linha (é o que tira do bloco de criativos o lead que
 * não tem nem utm_content nem utm_term).
 */
function agrupa(
  linhas: LeadCru[],
  chave: (l: LeadCru) => { a: string; b: string } | null
): Linha[] {
  const mapa = new Map<string, Linha>();
  for (const l of linhas) {
    const partes = chave(l);
    if (!partes) continue;
    const canal = canalGravado(l.canal);
    const id = `${canal}|${partes.a}|${partes.b}`;
    const atual = mapa.get(id);
    mapa.set(
      id,
      atual
        ? {
            ...atual,
            leads: atual.leads + 1,
            agendados: atual.agendados + (FASES_AGENDADO.has(l.fase) ? 1 : 0),
            convertidos: atual.convertidos + (l.fase === "convertido" ? 1 : 0),
            primeiro:
              atual.primeiro && atual.primeiro < l.created_at ? atual.primeiro : l.created_at,
            ultimo: atual.ultimo && atual.ultimo > l.created_at ? atual.ultimo : l.created_at,
          }
        : {
            canal,
            a: partes.a,
            b: partes.b,
            leads: 1,
            agendados: FASES_AGENDADO.has(l.fase) ? 1 : 0,
            convertidos: l.fase === "convertido" ? 1 : 0,
            primeiro: l.created_at,
            ultimo: l.created_at,
          }
    );
  }
  return ordena([...mapa.values()]);
}

export default async function OrigemPage({
  searchParams,
}: {
  searchParams: Promise<LeadsSearchParams>;
}) {
  await requireSection("leads");
  const sp = await searchParams;

  // Esta tela só recorta por período. Carregar busca, fase e temperatura da URL
  // só para repassá-los ao link da lista abriria os leads com um filtro que a
  // tabela daqui nunca aplicou, e os números não bateriam.
  const bruto = parseFiltros(sp);
  const filtros: FiltrosLead = {
    busca: "",
    periodo: bruto.periodo,
    de: bruto.de,
    ate: bruto.ate,
  };
  const { inicio, fim } = intervaloDoPeriodo(filtros);
  const temRecorte = Boolean(inicio || fim);

  const sb = await createClient();

  const consultaLeads = (() => {
    let q = sb
      .from("leads")
      .select(COLUNAS_ORIGEM, { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(LIMITE_LEADS);
    if (inicio) q = q.gte("created_at", inicio);
    if (fim) q = q.lte("created_at", fim);
    return q.returns<LeadCru[]>();
  })();

  // A view não tem data por lead: só o primeiro e o último de cada campanha.
  // Recortada por período, ela responderia "campanhas ativas no período" com os
  // números do histórico inteiro. Com recorte, portanto, a contagem vem da
  // tabela; sem recorte, vem da view, que é completa e não tem teto de linhas.
  const [daView, daTabela] = await Promise.all([
    temRecorte ? null : sb.from("leads_por_campanha").select("*").returns<LinhaDaView[]>(),
    consultaLeads,
  ]);

  const erroCampanhas = temRecorte ? daTabela.error : (daView?.error ?? null);
  if (erroCampanhas) {
    console.error("[origem] falha ao carregar campanhas", {
      code: erroCampanhas.code,
      message: erroCampanhas.message,
      hint: erroCampanhas.hint,
      fonte: temRecorte ? "leads" : "leads_por_campanha",
    });
  }
  if (daTabela.error && !temRecorte) {
    console.error("[origem] falha ao carregar criativos", {
      code: daTabela.error.code,
      message: daTabela.error.message,
      hint: daTabela.error.hint,
    });
  }

  const leadsCarregados = daTabela.data ?? [];
  const truncado = (daTabela.count ?? 0) > leadsCarregados.length;

  const campanhas: Linha[] = temRecorte
    ? agrupa(leadsCarregados, (l) => ({ a: campanhaDoLead(l), b: "" }))
    : ordena(
        (daView?.data ?? []).map((r) => ({
          canal: canalGravado(r.canal),
          a: r.campanha || SEM_CAMPANHA,
          b: "",
          leads: Number(r.leads ?? 0),
          agendados: Number(r.agendados ?? 0),
          convertidos: Number(r.convertidos ?? 0),
          primeiro: r.primeiro,
          ultimo: r.ultimo,
        }))
      );

  const criativos = agrupa(leadsCarregados, (l) => {
    const a = l.utm_content?.trim() || "";
    const b = l.utm_term?.trim() || "";
    return a || b ? { a: a || "—", b: b || "—" } : null;
  });

  // Canais na ordem de CANAIS_ORDEM, para o bloco de criativos poder trocar o
  // cabeçalho da tabela por canal sem inventar uma segunda ordem.
  const canaisComCriativo = CANAIS_ORDEM.filter((c) => criativos.some((l) => l.canal === c));

  const somaLeads = campanhas.reduce((s, l) => s + l.leads, 0);
  const somaAgendados = campanhas.reduce((s, l) => s + l.agendados, 0);
  const somaConvertidos = campanhas.reduce((s, l) => s + l.convertidos, 0);

  const queryPeriodo = filtrosParaQuery(filtros);

  return (
    <main className="p-8 md:p-12">
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-widest3 text-cocoa mb-3">CRM</div>
        <h1 className="font-display text-4xl text-ink leading-tight">Origem</h1>
        <p className="text-sm text-ink/70 mt-2 max-w-xl leading-relaxed">
          Qual campanha traz lead e qual traz paciente, sem abrir lead por lead.
        </p>
      </header>

      <div className="mb-8">
        <SeletorPeriodo
          periodo={filtros.periodo}
          de={filtros.de}
          ate={filtros.ate}
          pathname={PATHNAME}
          queryBase={{}}
        />
      </div>

      {erroCampanhas ? (
        <ErroDeCarga codigo={erroCampanhas.code ?? "sem código"} />
      ) : (
        <>
          <section aria-labelledby="titulo-campanhas" className="mb-14">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 mb-4">
              <h2 id="titulo-campanhas" className="font-display text-2xl text-ink">
                Canal e campanha
              </h2>
              {campanhas.length > 0 && (
                <dl className="flex items-end gap-8">
                  <Resumo rotulo="Leads" valor={somaLeads} />
                  <Resumo rotulo="Agendados" valor={somaAgendados} />
                  <Resumo rotulo="Convertidos" valor={somaConvertidos} />
                </dl>
              )}
            </div>

            {truncado && temRecorte && <AvisoDeTeto total={daTabela.count ?? 0} />}

            {campanhas.length === 0 ? (
              <Vazio
                titulo={
                  temRecorte ? "Nenhum lead nesse período." : "Ainda não chegou nenhum lead."
                }
                texto={
                  temRecorte
                    ? "Abra o período para os últimos 30 dias ou para todo o histórico."
                    : "Assim que o primeiro lead entrar pelo site, a campanha dele aparece aqui."
                }
              />
            ) : (
              <TabelaBase
                legenda="Leads por canal e campanha, com quantos avançaram para agendamento e conversão"
                colunas={["Canal", "Campanha"]}
                linhas={campanhas}
                linkDaLinha={(l) => ({
                  pathname: "/admin/crm/leads",
                  query: { view: "lista", canal: l.canal, ...queryPeriodo },
                })}
              />
            )}
          </section>

          <section aria-labelledby="titulo-criativos">
            <div className="mb-4">
              <h2 id="titulo-criativos" className="font-display text-2xl text-ink">
                Criativos e palavras
              </h2>
              <p className="text-sm text-ink/70 mt-1 max-w-xl leading-relaxed">
                O que vem depois da campanha: o anúncio na Meta, a palavra-chave no Google.
              </p>
            </div>

            {truncado && !temRecorte && <AvisoDeTeto total={daTabela.count ?? 0} />}

            {daTabela.error ? (
              <ErroDeCarga codigo={daTabela.error.code ?? "sem código"} compacto />
            ) : canaisComCriativo.length === 0 ? (
              <Vazio
                titulo="Nenhum anúncio identificado."
                texto="Os leads deste recorte chegaram sem utm_content nem utm_term. Marque os anúncios com UTM e o detalhe aparece aqui."
              />
            ) : (
              <div className="space-y-8">
                {canaisComCriativo.map((canal) => {
                  const rotulos = rotulosUtm(canal);
                  return (
                    <div key={canal}>
                      <h3 className="mb-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-widest2 ${CANAL_BADGE[canal]}`}
                        >
                          {CANAL_LABEL[canal]}
                        </span>
                      </h3>
                      <TabelaBase
                        legenda={`${CANAL_LABEL[canal]}: leads por ${rotulos.a.toLowerCase()} e ${rotulos.b.toLowerCase()}`}
                        colunas={[rotulos.a, rotulos.b]}
                        linhas={criativos.filter((l) => l.canal === canal)}
                        semSelo
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Resumo({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest2 text-ink/70">{rotulo}</dt>
      <dd className="font-display text-3xl text-ink leading-none mt-1 tabular-nums">{valor}</dd>
    </div>
  );
}

const TH = "text-left text-[10px] uppercase tracking-widest2 text-ink/70 font-normal py-3 px-4";
const TH_NUM = `${TH} text-right`;
const TD = "py-2 px-4 align-middle";

/**
 * Uma tabela só para os dois blocos: as colunas de funil são idênticas, e o que
 * muda é o par de colunas da esquerda (canal + campanha, ou anúncio + palavra).
 */
function TabelaBase({
  legenda,
  colunas,
  linhas,
  linkDaLinha,
  semSelo,
}: {
  legenda: string;
  colunas: [string, string];
  linhas: Linha[];
  linkDaLinha?: (l: Linha) => { pathname: string; query: Record<string, string> };
  semSelo?: boolean;
}) {
  return (
    // A rolagem horizontal mora no cartão, nunca na página: no celular a tabela
    // tem mais coluna do que cabe, e deixar a página rolar de lado leva junto o
    // cabeçalho e o menu.
    <div className="editorial-card rounded-3xl overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <caption className="sr-only">{legenda}</caption>
        <thead>
          <tr className="border-b border-cocoa/15">
            <th scope="col" className={TH}>
              {colunas[0]}
            </th>
            <th scope="col" className={TH}>
              {colunas[1]}
            </th>
            <th scope="col" className={TH_NUM}>
              Leads
            </th>
            <th scope="col" className={TH_NUM}>
              Agendados
            </th>
            <th scope="col" className={TH_NUM}>
              Convertidos
            </th>
            <th scope="col" className={TH_NUM}>
              Avanço
            </th>
            <th scope="col" className={TH}>
              Primeiro
            </th>
            <th scope="col" className={TH}>
              Último
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const destino = linkDaLinha?.(l);
            return (
              <tr
                key={`${l.canal}|${l.a}|${l.b}`}
                className="border-b border-cocoa/10 last:border-0 transition-colors motion-reduce:transition-none hover:bg-cocoa/[0.05] focus-within:bg-cocoa/[0.05]"
              >
                <td className={TD}>
                  {semSelo ? (
                    <span className="text-ink/80 break-words">{l.a}</span>
                  ) : (
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-widest2 whitespace-nowrap ${CANAL_BADGE[l.canal]}`}
                    >
                      {CANAL_LABEL[l.canal]}
                    </span>
                  )}
                </td>
                <td className={`${TD} max-w-[22rem]`}>
                  {destino ? (
                    // O alvo de toque é o próprio nome: 44px de altura mínima,
                    // e a seta indica que a linha leva a algum lugar.
                    <Link
                      href={destino}
                      className="group inline-flex min-h-[44px] items-center gap-2 text-ink hover:text-cocoa transition-colors motion-reduce:transition-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60"
                    >
                      <span className="break-words">{semSelo ? l.b : l.a}</span>
                      <ArrowUpRight
                        className="h-3.5 w-3.5 shrink-0 text-cocoa opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity motion-reduce:transition-none"
                        aria-hidden
                      />
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-[44px] items-center text-ink/80 break-words">
                      {semSelo ? l.b : l.a}
                    </span>
                  )}
                </td>
                <td className={`${TD} text-right font-display text-lg text-ink tabular-nums`}>
                  {l.leads}
                </td>
                <td className={`${TD} text-right tabular-nums text-ink/80`}>{l.agendados}</td>
                <td className={`${TD} text-right tabular-nums text-ink/80`}>{l.convertidos}</td>
                <td className={`${TD} text-right tabular-nums`}>
                  <span className={l.agendados > 0 ? "text-cocoa" : "text-ink/70"}>
                    {taxaDeAvanco(l)}%
                  </span>
                </td>
                <td className={`${TD} text-[11px] text-ink/70 whitespace-nowrap`}>
                  {l.primeiro ? formataDiaSP(l.primeiro) : "—"}
                </td>
                <td className={`${TD} text-[11px] text-ink/70 whitespace-nowrap`}>
                  {l.ultimo ? formataDiaSP(l.ultimo) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AvisoDeTeto({ total }: { total: number }) {
  return (
    <p className="text-[11px] uppercase tracking-widest2 text-cocoa mb-3">
      Contando os {LIMITE_LEADS} leads mais recentes de {total}. Recorte o período para fechar a
      conta.
    </p>
  );
}

function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="editorial-card rounded-3xl p-12 text-center">
      <p className="font-display text-2xl text-ink">{titulo}</p>
      <p className="text-sm text-ink/70 mt-2 max-w-md mx-auto leading-relaxed">{texto}</p>
    </div>
  );
}

function ErroDeCarga({ codigo, compacto }: { codigo: string; compacto?: boolean }) {
  return (
    <div
      role="alert"
      className={`editorial-card rounded-3xl flex items-start gap-3 ${compacto ? "p-6" : "p-8"}`}
    >
      <AlertCircle className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="font-display text-xl text-ink">Não deu para carregar a origem.</p>
        <p className="text-sm text-ink/70 mt-1">
          {/* Só o código aparece: a mensagem do Postgres descreve a estrutura
              interna do banco. */}
          {codigo === "42P01" || codigo === "PGRST205"
            ? "O banco ainda não tem a view leads_por_campanha: falta aplicar a migration 010_origem_ids.sql."
            : `A base respondeu com um erro (${codigo}). Atualize a página; se continuar, o registro completo está no log do servidor.`}
        </p>
      </div>
    </div>
  );
}
