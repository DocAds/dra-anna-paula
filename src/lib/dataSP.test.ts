import { test } from "node:test";
import assert from "node:assert/strict";
import { inicioDoDiaSP, fimDoDiaSP, somaDias, primeiroDiaDoMesSP, formataDiaSP, formataDiaHoraSP } from "./dataSP.ts";

// O site roda em Cloudflare Workers, onde o fuso do runtime é UTC. Sem esta
// conversão, um lead que chega às 22h de terça aparece como quarta na tela e
// desaparece do filtro "hoje".
test("início e fim do dia são o dia em São Paulo, não em UTC", () => {
  assert.equal(inicioDoDiaSP("2026-09-09").toISOString(), "2026-09-09T03:00:00.000Z");
  assert.equal(fimDoDiaSP("2026-09-09").toISOString(), "2026-09-10T02:59:59.999Z");
});

test("lead da noite cai no dia certo", () => {
  // 22h30 de 08/09 em São Paulo = 01h30 de 09/09 em UTC.
  const lead = new Date("2026-09-09T01:30:00Z");
  assert.ok(lead >= inicioDoDiaSP("2026-09-08") && lead <= fimDoDiaSP("2026-09-08"), "deveria contar no dia 08");
  assert.ok(!(lead >= inicioDoDiaSP("2026-09-09")), "não pode contar no dia 09");
});

test("a virada do ano não escorrega de dia", () => {
  assert.equal(inicioDoDiaSP("2027-01-01").toISOString(), "2027-01-01T03:00:00.000Z");
  assert.equal(fimDoDiaSP("2026-12-31").toISOString(), "2027-01-01T02:59:59.999Z");
});

test("somaDias atravessa mês e ano", () => {
  assert.equal(somaDias("2026-09-09", -30), "2026-08-10");
  assert.equal(somaDias("2026-01-01", -1), "2025-12-31");
  assert.equal(somaDias("2026-02-28", 1), "2026-03-01"); // 2026 não é bissexto
});

test("primeiro dia do mês", () => {
  assert.equal(primeiroDiaDoMesSP("2026-09-09"), "2026-09-01");
});

test("formatação curta não deixa pontuação do locale vazar", () => {
  // Montado por partes: o formato do locale muda entre runtimes, e um replace
  // sobre a string pronta quebra junto.
  const dia = formataDiaSP("2026-09-09T14:28:00Z");
  assert.equal(dia, "09 set");
  assert.ok(!dia.includes("."), "abreviação com ponto polui o card");
});

test("formatação com hora usa o relógio de São Paulo", () => {
  // 14:28 UTC = 11:28 em São Paulo.
  assert.equal(formataDiaHoraSP("2026-09-09T14:28:00Z"), "09 set 11:28");
});
