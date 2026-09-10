// Filtros da tela de leads: leitura da URL, saneamento e aplicação no banco.
//
// Duas decisões que valem para as duas visões (lista e kanban):
//
// 1. O estado mora na URL, não em useState. O link continua compartilhável, o
//    F5 mantém o recorte, o botão voltar funciona e a paginação não
//    dessincroniza. É por isso que a barra é um <form method="get">.
// 2. O filtro roda no banco, nunca em memória sobre um teto de linhas. Filtrar
//    depois de carregar 2000 leads funciona até o dia em que a clínica passa de
//    2000 e a tela começa a mentir em silêncio.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadFase, LeadTemperatura } from "@/lib/supabase/types";
import { FASES_ORDEM } from "@/lib/crmStatus";
import { isCanal, type CanalLead } from "@/lib/leadOrigem";
import { diaSP, inicioDoDiaSP, fimDoDiaSP, somaDias, primeiroDiaDoMesSP } from "@/lib/dataSP";

export type PeriodoLead = "tudo" | "hoje" | "7d" | "30d" | "mes" | "personalizado";

export const PERIODOS: { v: PeriodoLead; l: string }[] = [
  { v: "tudo", l: "Todo o período" },
  { v: "hoje", l: "Hoje" },
  { v: "7d", l: "Últimos 7 dias" },
  { v: "30d", l: "Últimos 30 dias" },
  { v: "mes", l: "Este mês" },
  { v: "personalizado", l: "Escolher datas" },
];

const TEMPERATURAS: LeadTemperatura[] = ["frio", "morno", "quente"];

export type FiltrosLead = {
  busca: string;
  fase?: LeadFase;
  canal?: CanalLead;
  temperatura?: LeadTemperatura;
  interesse?: string;
  periodo: PeriodoLead;
  de?: string;
  ate?: string;
};

// Chave repetida na URL (?q=a&q=b) chega como array. Tipar tudo como string
// mentiria para o TypeScript e derrubaria a página no primeiro .trim().
type Param = string | string[] | undefined;

export type LeadsSearchParams = {
  q?: Param;
  fase?: Param;
  canal?: Param;
  temp?: Param;
  interesse?: Param;
  periodo?: Param;
  de?: Param;
  ate?: Param;
  view?: Param;
  page?: Param;
};

/** Fica com o primeiro valor; o resto é ruído ou tentativa de confundir o parser. */
export const umValor = (v: Param): string | undefined => (Array.isArray(v) ? v[0] : v);

const MAX_BUSCA = 80;
const MAX_INTERESSE = 120;
const isDia = (v: string | undefined): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isFase = (v: string | undefined): v is LeadFase => !!v && (FASES_ORDEM as string[]).includes(v);
const isTemp = (v: string | undefined): v is LeadTemperatura =>
  !!v && (TEMPERATURAS as string[]).includes(v);
const isPeriodo = (v: string | undefined): v is PeriodoLead =>
  !!v && PERIODOS.some((p) => p.v === v);

/** Lê a URL descartando qualquer valor que não esteja na lista permitida. */
export function parseFiltros(sp: LeadsSearchParams): FiltrosLead {
  const periodoBruto = umValor(sp.periodo);
  const periodo = isPeriodo(periodoBruto) ? periodoBruto : "tudo";
  const deBruto = umValor(sp.de);
  const ateBruto = umValor(sp.ate);
  const de = isDia(deBruto) ? deBruto : undefined;
  const ate = isDia(ateBruto) ? ateBruto : undefined;
  const faseBruta = umValor(sp.fase);
  const canalBruto = umValor(sp.canal);
  const tempBruto = umValor(sp.temp);
  return {
    busca: (umValor(sp.q) ?? "").trim().slice(0, MAX_BUSCA),
    fase: isFase(faseBruta) ? faseBruta : undefined,
    canal: isCanal(canalBruto) ? canalBruto : undefined,
    temperatura: isTemp(tempBruto) ? tempBruto : undefined,
    interesse: umValor(sp.interesse)?.trim().slice(0, MAX_INTERESSE) || undefined,
    periodo,
    // Datas só existem no modo personalizado: mantê-las em outros períodos
    // fazia o calendário mostrar um intervalo destacado que não estava
    // aplicado. Invertidas trocam de lugar em vez de devolver lista vazia sem
    // explicação.
    ...(periodo !== "personalizado"
      ? { de: undefined, ate: undefined }
      : de && ate && de > ate
        ? { de: ate, ate: de }
        : { de, ate }),
  };
}

export const temFiltroAtivo = (f: FiltrosLead): boolean =>
  Boolean(f.busca || f.fase || f.canal || f.temperatura || f.interesse || f.periodo !== "tudo");

/** Devolve só as chaves preenchidas, para montar links sem lixo na URL. */
export function filtrosParaQuery(f: FiltrosLead): Record<string, string> {
  return {
    ...(f.busca ? { q: f.busca } : {}),
    ...(f.fase ? { fase: f.fase } : {}),
    ...(f.canal ? { canal: f.canal } : {}),
    ...(f.temperatura ? { temp: f.temperatura } : {}),
    ...(f.interesse ? { interesse: f.interesse } : {}),
    ...(f.periodo !== "tudo" ? { periodo: f.periodo } : {}),
    ...(f.periodo === "personalizado" && f.de ? { de: f.de } : {}),
    ...(f.periodo === "personalizado" && f.ate ? { ate: f.ate } : {}),
  };
}

/**
 * Intervalo do período, já convertido para o fuso do consultório.
 * "hoje" tem que ser o dia em São Paulo, não o dia UTC do datacenter.
 */
export function intervaloDoPeriodo(f: FiltrosLead): { inicio?: string; fim?: string } {
  const hoje = diaSP();
  switch (f.periodo) {
    case "hoje":
      return { inicio: inicioDoDiaSP(hoje).toISOString() };
    case "7d":
      return { inicio: inicioDoDiaSP(somaDias(hoje, -6)).toISOString() };
    case "30d":
      return { inicio: inicioDoDiaSP(somaDias(hoje, -29)).toISOString() };
    case "mes":
      return { inicio: inicioDoDiaSP(primeiroDiaDoMesSP(hoje)).toISOString() };
    case "personalizado":
      return {
        ...(f.de ? { inicio: inicioDoDiaSP(f.de).toISOString() } : {}),
        ...(f.ate ? { fim: fimDoDiaSP(f.ate).toISOString() } : {}),
      };
    default:
      return {};
  }
}

/**
 * Escapa o valor para dentro de um `.or()` do PostgREST.
 *
 * Sem isto, uma busca por "Maria (mãe), 11" é lida como sintaxe de filtro: a
 * vírgula separa condições e o parêntese abre um grupo. O resultado não é erro
 * visível, é filtro diferente do que a pessoa pediu. Valor entre aspas duplas é
 * tratado como literal; só a barra invertida e a própria aspa precisam de
 * escape.
 */
export const escapaValorPostgrest = (v: string): string =>
  v
    // Curingas do LIKE primeiro: quem digita "50%" quer buscar "50%", não
    // "qualquer coisa depois de 50". O * é reescrito para % pelo PostgREST
    // antes de chegar ao Postgres, então sai do termo.
    .replace(/\*/g, "")
    .replace(/[%_]/g, (m) => `\\${m}`)
    // Só então a sintaxe do PostgREST, para não escapar as barras que acabamos
    // de introduzir uma segunda vez.
    .replace(/\\(?![%_])/g, "\\\\")
    .replace(/"/g, '\\"');

type QueryDeLeads = ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;

/** Aplica o recorte na query. Mesma função para a lista e para o kanban. */
export function aplicaFiltros<Q extends QueryDeLeads>(query: Q, f: FiltrosLead): Q {
  let q = query;
  if (f.fase) q = q.eq("fase", f.fase) as Q;
  if (f.canal) q = q.eq("canal", f.canal) as Q;
  if (f.temperatura) q = q.eq("temperatura", f.temperatura) as Q;
  if (f.interesse) q = q.eq("interesse", f.interesse) as Q;

  const { inicio, fim } = intervaloDoPeriodo(f);
  if (inicio) q = q.gte("created_at", inicio) as Q;
  if (fim) q = q.lte("created_at", fim) as Q;

  if (f.busca) {
    const v = escapaValorPostgrest(f.busca);
    q = q.or(`nome.ilike."%${v}%",whatsapp.ilike."%${v}%",email.ilike."%${v}%"`) as Q;
  }
  return q;
}

/** Resumo do recorte em uma frase, para o estado vazio dizer o que foi filtrado. */
export function descreveFiltros(f: FiltrosLead, rotulos: {
  fase: Record<string, string>;
  canal: Record<string, string>;
  temperatura: Record<string, string>;
}): string {
  const partes: string[] = [];
  if (f.busca) partes.push(`busca "${f.busca}"`);
  if (f.fase) partes.push(`fase ${rotulos.fase[f.fase]}`);
  if (f.canal) partes.push(`origem ${rotulos.canal[f.canal]}`);
  if (f.temperatura) partes.push(`temperatura ${rotulos.temperatura[f.temperatura]}`);
  if (f.interesse) partes.push(`interesse ${f.interesse}`);
  if (f.periodo === "personalizado" && (f.de || f.ate)) {
    partes.push(`período ${f.de ?? "início"} a ${f.ate ?? "hoje"}`);
  } else if (f.periodo !== "tudo") {
    partes.push(`período ${PERIODOS.find((p) => p.v === f.periodo)?.l.toLowerCase()}`);
  }
  if (!partes.length) return "";
  if (partes.length === 1) return partes[0];
  return `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
}
