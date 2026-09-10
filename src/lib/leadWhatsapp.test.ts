import { test } from "node:test";
import assert from "node:assert/strict";
import { numeroWhatsapp, mascaraTelefone, linkWhatsapp, mensagemWhatsapp } from "./leadWhatsapp.ts";

test("número brasileiro ganha o DDI", () => {
  assert.equal(numeroWhatsapp("(11) 91604-9939"), "5511916049939");
  assert.equal(numeroWhatsapp("11 3255-4000"), "551132554000");
});

test("quem já digitou o DDI não ganha outro", () => {
  assert.equal(numeroWhatsapp("+55 11 91604-9939"), "5511916049939");
  assert.equal(numeroWhatsapp("5511916049939"), "5511916049939");
});

test("55 como DDD não é confundido com país", () => {
  // 55 é o DDD de Santa Maria (RS): 11 dígitos, não 12, então leva o DDI.
  assert.equal(numeroWhatsapp("(55) 99999-8888"), "5555999998888");
});

test("número estrangeiro não vira brasileiro", () => {
  assert.equal(numeroWhatsapp("+351 912 345 678", "PT"), "351912345678");
  assert.equal(numeroWhatsapp("+1 415 555 0100", "US"), "14155550100");
});

test("sem número, sem botão", () => {
  assert.equal(numeroWhatsapp(""), "");
  assert.equal(numeroWhatsapp(null), "");
  assert.equal(numeroWhatsapp("sem dígito nenhum"), "");
  assert.equal(linkWhatsapp({ nome: "Ana", whatsapp: null }), null);
});

test("máscara deixa o telefone legível sem alterar o número", () => {
  assert.equal(mascaraTelefone("5511916049939"), "(11) 91604-9939");
  assert.equal(mascaraTelefone("11916049939"), "(11) 91604-9939");
  assert.equal(mascaraTelefone("1132554000"), "(11) 3255-4000");
});

test("máscara não inventa formato para número de fora", () => {
  assert.equal(mascaraTelefone("+351 912 345 678", "PT"), "+351 912 345 678");
});

test("a mensagem usa o primeiro nome e o nome da clínica vem da configuração", () => {
  const msg = mensagemWhatsapp({ nome: "Ana Paula Souza" });
  assert.match(msg, /^Olá Ana, /);
  // Nome do cliente nunca escrito no componente: é o que impede vazar num porte.
  assert.match(msg, /clínica Anna Bomtempo/);
});

test("a mensagem cita o interesse quando existe", () => {
  assert.match(mensagemWhatsapp({ nome: "Ana", interesse: "Ultraformer" }), /interesse é Ultraformer/);
});

test("o link sai pronto e com o texto codificado", () => {
  const href = linkWhatsapp({ nome: "Ana", whatsapp: "(11) 91604-9939" });
  assert.ok(href?.startsWith("https://wa.me/5511916049939?text="));
  assert.ok(!href?.includes(" "), "espaço cru na URL");
});
