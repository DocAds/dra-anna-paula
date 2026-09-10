// Link de WhatsApp para falar com um lead do CRM.
//
// Por que existe: o número chega do formulário como o visitante digitou, e o
// wa.me só abre a conversa certa com DDI + DDD + número, sem símbolo. A regra
// respeita whatsapp_country em vez de cravar 55: lead estrangeiro (o site
// recebe acesso de fora) não pode virar número brasileiro inválido.
//
// Fonte única para a ficha, o card da lista e o card do kanban.

import { SITE } from "@/lib/site";

type LeadContato = {
  nome: string;
  whatsapp: string | null;
  whatsapp_country?: string | null;
  interesse?: string | null;
};

/**
 * Número pronto para o wa.me: só dígitos, com DDI.
 * Devolve "" quando não há número utilizável — quem chama não deve renderizar
 * o botão nesse caso.
 */
export function numeroWhatsapp(
  whatsapp: string | null | undefined,
  country?: string | null
): string {
  const digitos = String(whatsapp || "").replace(/\D/g, "");
  if (!digitos) return "";

  const brasileiro = !country || country.toUpperCase() === "BR";
  // 12 dígitos = 55 + DDD + 8. Abaixo disso o "55" inicial é o próprio DDD
  // (55 é Rio Grande do Sul), não o país, e prefixar de novo quebraria.
  const jaTemDdi = digitos.startsWith("55") && digitos.length >= 12;
  if (brasileiro && !jaTemDdi) return `55${digitos}`;
  return digitos;
}

/**
 * Primeira mensagem do atendimento. O nome da clínica sai de SITE, nunca
 * escrito no componente: é o que impede o nome de um cliente vazar quando esta
 * tela for portada para outro projeto.
 */
export function mensagemWhatsapp(lead: Pick<LeadContato, "nome" | "interesse">): string {
  const primeiroNome = String(lead.nome || "").trim().split(/\s+/)[0] || "";
  const abertura = primeiroNome ? `Olá ${primeiroNome}, ` : "Olá, ";
  const base = `${abertura}falo da clínica ${SITE.shortName}. Tudo bem? Você deixou contato pelo nosso site.`;
  return lead.interesse ? `${base} Vi que seu interesse é ${lead.interesse}.` : base;
}

/**
 * URL completa da conversa, ou null quando o lead não tem número.
 */
export function linkWhatsapp(lead: LeadContato): string | null {
  const numero = numeroWhatsapp(lead.whatsapp, lead.whatsapp_country);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagemWhatsapp(lead))}`;
}

/**
 * Telefone brasileiro legível no card: (11) 91604-9939.
 * Número de outro país volta como está — inventar máscara estrangeira erra mais
 * do que acerta.
 */
export function mascaraTelefone(
  whatsapp: string | null | undefined,
  country?: string | null
): string {
  const bruto = String(whatsapp || "").trim();
  if (!bruto) return "";
  const brasileiro = !country || country.toUpperCase() === "BR";
  if (!brasileiro) return bruto;

  let d = bruto.replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return bruto;
}
