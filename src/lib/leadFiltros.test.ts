import { test } from "node:test";
import assert from "node:assert/strict";
import { escapaValorPostgrest, parseFiltros, temFiltroAtivo, intervaloDoPeriodo } from "./leadFiltros.ts";

// A busca da tela vai para dentro de um .or() do PostgREST, cuja sintaxe usa
// vírgula para separar condições e parêntese para agrupar. Sem escape, uma
// busca comum vira um filtro DIFERENTE do que a pessoa pediu, sem erro visível.
test("escape neutraliza a sintaxe de filtro do PostgREST", () => {
  // Aspas fechariam o literal e o resto viraria sintaxe.
  assert.equal(escapaValorPostgrest('aspas"aqui'), 'aspas\\"aqui');
  // Barra invertida precisa sobreviver como literal.
  assert.equal(escapaValorPostgrest("c\\d"), "c\\\\d");
  // Vírgula e parêntese ficam inertes dentro das aspas que a query já põe.
  assert.equal(escapaValorPostgrest("Maria (mãe), 11"), "Maria (mãe), 11");
});

test("escape neutraliza os curingas do LIKE", () => {
  // Quem digita 50% quer achar "50%", não "qualquer coisa começando com 50".
  assert.equal(escapaValorPostgrest("50%"), "50\\%");
  assert.equal(escapaValorPostgrest("a_b"), "a\\_b");
  // O * é reescrito para % pelo PostgREST antes do Postgres, então sai do termo.
  assert.equal(escapaValorPostgrest("busca*ampla"), "buscaampla");
});

test("escape não estraga texto comum", () => {
  assert.equal(escapaValorPostgrest("Ana Paula"), "Ana Paula");
  assert.equal(escapaValorPostgrest("11 91604-9939"), "11 91604-9939");
});

test("tentativa de injetar condição extra não escapa das aspas", () => {
  const v = escapaValorPostgrest('",fase.eq.perdido,nome.ilike."');
  // Toda aspa saiu escapada: não há como fechar o literal e abrir condição nova.
  assert.ok(!/(^|[^\\])"/.test(v), `sobrou aspa sem escape: ${v}`);
});

test("parseFiltros aceita chave repetida na URL sem quebrar", () => {
  // ?q=a&q=b chega como array; sem tratamento, o .trim() derruba a página.
  const f = parseFiltros({ q: ["maria", "outra"], fase: ["novo", "perdido"] });
  assert.equal(f.busca, "maria");
  assert.equal(f.fase, "novo");
});

test("parseFiltros descarta valor fora da lista permitida", () => {
  const f = parseFiltros({ fase: "inventada", canal: "hacker", temp: "morna", periodo: "sempre" });
  assert.equal(f.fase, undefined);
  assert.equal(f.canal, undefined);
  assert.equal(f.temperatura, undefined);
  assert.equal(f.periodo, "tudo");
});

test("parseFiltros troca datas invertidas de lugar", () => {
  const f = parseFiltros({ periodo: "personalizado", de: "2026-09-30", ate: "2026-09-01" });
  assert.equal(f.de, "2026-09-01");
  assert.equal(f.ate, "2026-09-30");
});

test("parseFiltros ignora datas fora do período personalizado", () => {
  // Senão o calendário destaca um intervalo que não está aplicado.
  const f = parseFiltros({ periodo: "7d", de: "2026-09-01", ate: "2026-09-30" });
  assert.equal(f.de, undefined);
  assert.equal(f.ate, undefined);
});

test("parseFiltros corta busca longa", () => {
  assert.equal(parseFiltros({ q: "x".repeat(500) }).busca.length, 80);
});

test("temFiltroAtivo só é verdade quando há recorte", () => {
  assert.equal(temFiltroAtivo(parseFiltros({})), false);
  assert.equal(temFiltroAtivo(parseFiltros({ view: "lista", page: "3" })), false);
  assert.equal(temFiltroAtivo(parseFiltros({ canal: "google-ads" })), true);
});

test("período recorta no fuso do consultório, não no do servidor", () => {
  const { inicio } = intervaloDoPeriodo(parseFiltros({ periodo: "hoje" }));
  assert.ok(inicio, "hoje precisa ter início");
  // 00:00 em São Paulo é 03:00 UTC (o país não tem horário de verão desde 2019).
  assert.match(inicio!, /T03:00:00\.000Z$/);
});

test("período tudo não recorta nada", () => {
  assert.deepEqual(intervaloDoPeriodo(parseFiltros({})), {});
});
