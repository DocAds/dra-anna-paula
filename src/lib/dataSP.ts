// Datas no fuso do consultório (America/Sao_Paulo).
//
// Por que existe: o site roda em Cloudflare Workers, onde o fuso do runtime é
// UTC. Sem isto, um lead que chega às 22h de terça aparece como quarta-feira na
// tela e some do filtro "hoje". A conversão é feita com Intl, que já vem no
// runtime, em vez de trazer date-fns-tz só para isso.

export const TZ = "America/Sao_Paulo";

/** "2026-09-09" para o instante dado, no fuso de São Paulo. */
export function diaSP(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Quantos milissegundos São Paulo está atrás do UTC naquele dia.
 * Calculado por diferença para não depender de "longOffset", que nem todo
 * runtime expõe, e para continuar certo se o horário de verão voltar.
 *
 * A medição é feita ao MEIO-DIA do dia pedido: a virada do horário de verão
 * acontece de madrugada, e medir em 00:00 ou 23:59 devolveria o offset do lado
 * errado da transição.
 */
function offsetDoDia(dia: string): number {
  const meioDia = new Date(`${dia}T12:00:00Z`);
  const emSP = new Date(meioDia.toLocaleString("en-US", { timeZone: TZ }));
  const emUTC = new Date(meioDia.toLocaleString("en-US", { timeZone: "UTC" }));
  return emUTC.getTime() - emSP.getTime();
}

/** Instante UTC correspondente a 00:00:00 daquele dia em São Paulo. */
export function inicioDoDiaSP(dia: string): Date {
  return new Date(new Date(`${dia}T00:00:00Z`).getTime() + offsetDoDia(dia));
}

/** Instante UTC correspondente a 23:59:59.999 daquele dia em São Paulo. */
export function fimDoDiaSP(dia: string): Date {
  return new Date(new Date(`${dia}T23:59:59.999Z`).getTime() + offsetDoDia(dia));
}

/** Soma (ou subtrai) dias sobre uma data no formato "YYYY-MM-DD". */
export function somaDias(dia: string, dias: number): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Primeiro dia do mês corrente em São Paulo. */
export function primeiroDiaDoMesSP(hoje: string = diaSP()): string {
  return `${hoje.slice(0, 7)}-01`;
}

const OPCOES_CURTO: Intl.DateTimeFormatOptions = {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

const OPCOES_LONGO: Intl.DateTimeFormatOptions = {
  timeZone: TZ,
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

// Montado por partes, não pelo texto pronto: o formato do locale muda entre
// runtimes ("09 de set." aqui, "09 set" ali) e um replace de pontuação sobre a
// string inteira quebra junto.
function partes(iso: string, opcoes: Intl.DateTimeFormatOptions) {
  const p = new Intl.DateTimeFormat("pt-BR", opcoes).formatToParts(new Date(iso));
  const pega = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)?.value ?? "";
  return {
    dia: pega("day"),
    mes: pega("month").replace(".", ""),
    ano: pega("year"),
    hora: pega("hour"),
    minuto: pega("minute"),
  };
}

/** "09 set" */
export function formataDiaSP(iso: string): string {
  const { dia, mes } = partes(iso, OPCOES_CURTO);
  return `${dia} ${mes}`;
}

/** "09 set 14:28" */
export function formataDiaHoraSP(iso: string): string {
  const { dia, mes, hora, minuto } = partes(iso, OPCOES_CURTO);
  return `${dia} ${mes} ${hora}:${minuto}`;
}

/** "09 de setembro de 2026 às 14:28" */
export function formataCompletoSP(iso: string): string {
  const { dia, mes, ano, hora, minuto } = partes(iso, OPCOES_LONGO);
  return `${dia} de ${mes} de ${ano} às ${hora}:${minuto}`;
}
