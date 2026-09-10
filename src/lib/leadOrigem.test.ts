import { test } from "node:test";
import assert from "node:assert/strict";
import { classificaCanal, canalDoLead, origemDoCard } from "./leadOrigem.ts";

// A tabela abaixo é o contrato entre TRÊS lugares que precisam concordar:
//   - classificaCanal(), aqui
//   - o insert em src/app/api/lead/route.ts, que grava a coluna canal
//   - o backfill em supabase/migrations/008_leads_origem.sql
//
// Se um lead novo for classificado de um jeito e o histórico de outro, o filtro
// por origem passa a mostrar números diferentes para a mesma pergunta. Mudou a
// regra: mude nos três e ajuste esta tabela.
const CASOS: [string, Parameters<typeof classificaCanal>[0], string][] = [
  ["clique de anúncio do Google ganha de tudo", { gclid: "abc", utm_source: "instagram" }, "google-ads"],
  ["clique da Meta ganha do utm", { fbclid: "xyz", utm_source: "google" }, "meta-ads"],
  ["google com cpc é pago", { utm_source: "google", utm_medium: "cpc" }, "google-ads"],
  ["google sem medium é orgânico", { utm_source: "google" }, "google-organico"],
  ["google com medium organic é orgânico", { utm_source: "google", utm_medium: "organic" }, "google-organico"],
  ["instagram pago", { utm_source: "instagram", utm_medium: "paid_social" }, "meta-ads"],
  ["instagram sem pagar é social", { utm_source: "instagram" }, "social"],
  ["ig como palavra inteira é Meta", { utm_source: "ig", utm_medium: "cpc" }, "meta-ads"],
  ["ig com separador continua Meta", { utm_source: "ig_stories" }, "social"],
  // Os dois casos que motivaram trocar includes("ig") por palavra inteira:
  ["digital NÃO é ig", { utm_source: "digital" }, "outro"],
  ["signal NÃO é ig", { utm_source: "signal" }, "outro"],
  ["tiktok é social", { utm_source: "tiktok" }, "social"],
  ["utm desconhecido cai em outro", { utm_source: "parceria-revista" }, "outro"],
  ["sem utm, referrer do google é orgânico", { referrer: "https://www.google.com/search" }, "google-organico"],
  ["sem utm, referrer qualquer é referência", { referrer: "https://blogdasaude.com.br/post" }, "referencia"],
  ["clique direto no WhatsApp", { source: "whatsapp:float" }, "whatsapp"],
  ["sem nada é acesso direto", {}, "direto"],
  ["vazio não conta como preenchido", { utm_source: "", gclid: "" }, "direto"],
];

for (const [nome, entrada, esperado] of CASOS) {
  test(`classificaCanal: ${nome}`, () => {
    assert.equal(classificaCanal(entrada), esperado);
  });
}

test("canalDoLead prefere o canal já gravado", () => {
  // O histórico foi classificado uma vez pela migration; reclassificar na
  // leitura faria a tela discordar do filtro, que consulta a coluna.
  assert.equal(canalDoLead({ canal: "meta-ads", gclid: "abc" }), "meta-ads");
});

test("canalDoLead ignora canal inválido e reclassifica", () => {
  assert.equal(canalDoLead({ canal: "lixo", gclid: "abc" }), "google-ads");
});

test("origemDoCard mostra campanha no tráfego pago e botão no resto", () => {
  const pago = origemDoCard({ gclid: "a", utm_campaign: "rejuvenescimento-sp", source: "hero" });
  assert.equal(pago.label, "Google Ads");
  assert.equal(pago.detalhe, "rejuvenescimento-sp");

  const organico = origemDoCard({ source: "float" });
  assert.equal(organico.label, "Acesso direto");
  assert.equal(organico.detalhe, "Botão flutuante");
});

test("origemDoCard não inventa detalhe quando não há", () => {
  assert.equal(origemDoCard({}).detalhe, null);
});
