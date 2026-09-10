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
  // A UTM manda quando existe: era o inverso, e todo lead com fbclid virava
  // Meta Ads, inclusive os que a própria UTM declarava orgânicos.
  ["utm de instagram orgânico não vira Meta Ads só por ter fbclid", { fbclid: "xyz", utm_source: "ig", utm_medium: "social" }, "social"],
  ["utm do Google com gclid é Google Ads", { gclid: "abc", utm_source: "google", utm_medium: "cpc" }, "google-ads"],
  ["sem utm, o clique de anúncio decide", { gclid: "abc" }, "google-ads"],
  ["sem utm, fbclid é Meta Ads", { fbclid: "xyz" }, "meta-ads"],
  ["google com cpc é pago", { utm_source: "google", utm_medium: "cpc" }, "google-ads"],
  ["google sem medium é orgânico", { utm_source: "google" }, "google-organico"],
  ["google com medium organic é orgânico", { utm_source: "google", utm_medium: "organic" }, "google-organico"],
  ["instagram pago", { utm_source: "instagram", utm_medium: "paid_social" }, "meta-ads"],
  ["instagram sem pagar é social", { utm_source: "instagram" }, "social"],
  ["ig com cpc é Meta Ads", { utm_source: "ig", utm_medium: "cpc" }, "meta-ads"],
  ["ig sem sinal de pago é social", { utm_source: "ig_stories" }, "social"],
  ["MetaAds com o nome da campanha no medium continua sendo pago", { utm_source: "MetaAds", utm_medium: "[GEOLOCALIZADO | AMERICAN + BELEZA]", fbclid: "x" }, "meta-ads"],
  // Os dois casos que motivaram trocar includes("ig") por palavra inteira:
  ["digital NÃO é ig", { utm_source: "digital" }, "referencia"],
  ["signal NÃO é ig", { utm_source: "signal" }, "referencia"],
  // "leads" contém "ads": o teste de pago não pode ser includes("ads").
  ["a palavra leads não faz virar tráfego pago", { utm_source: "newsletter", utm_medium: "leads" }, "referencia"],
  ["tiktok é social", { utm_source: "tiktok" }, "social"],
  ["utm desconhecido é referência, não 'outro'", { utm_source: "parceria-revista" }, "referencia"],
  // Canal novo: assistente de IA já manda tráfego real.
  ["chatgpt é canal de IA", { utm_source: "chatgpt.com" }, "ia"],
  ["perplexity é canal de IA", { referrer: "https://www.perplexity.ai/search" }, "ia"],
  ["gemini não pode virar busca do Google", { utm_source: "gemini.google.com" }, "ia"],
  ["sem utm, referrer do google é orgânico", { referrer: "https://www.google.com/search" }, "google-organico"],
  ["sem utm, referrer qualquer é referência", { referrer: "https://blogdasaude.com.br/post" }, "referencia"],
  ["clique direto no WhatsApp", { source: "whatsapp:float" }, "whatsapp"],
  // "Acesso direto" só quando a pessoa entrou pela home sem nenhum sinal.
  ["entrou pela home sem sinal nenhum é direto", { landing_path: "/" }, "direto"],
  ["entrou numa página interna sem sinal é origem desconhecida", { landing_path: "/tratamentos/volnewmer" }, "nao-identificado"],
  ["sem nem saber a página de entrada, não afirmar direto", {}, "nao-identificado"],
  ["vazio não conta como preenchido", { utm_source: "", gclid: "", landing_path: "/" }, "direto"],
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

  const organico = origemDoCard({ source: "float", landing_path: "/" });
  assert.equal(organico.label, "Acesso direto");
  assert.equal(organico.detalhe, "Botão flutuante");
});

test("origemDoCard não inventa detalhe quando não há", () => {
  assert.equal(origemDoCard({}).detalhe, null);
});
