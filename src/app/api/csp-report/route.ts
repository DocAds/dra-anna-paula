import { NextResponse } from "next/server";

/**
 * Coleta das violações da CSP enquanto ela roda em Report-Only.
 *
 * O ponto desta rota é responder, com dado e não com palpite, à pergunta que
 * impede a CSP de entrar: "o que exatamente quebraria se eu ligar?". O site
 * injeta tags de marketing gravadas no painel, então o inventário de origens
 * muda sem passar por deploy, e uma CSP escrita no escuro derruba a medição de
 * conversão em silêncio.
 *
 * Fica aberta de propósito (o navegador manda o relatório sem credencial), e
 * por isso só registra: nunca grava no banco nem devolve conteúdo.
 */
export async function POST(req: Request) {
  try {
    const corpo = (await req.json()) as Record<string, Record<string, string>>;
    // O formato antigo manda { "csp-report": {...} }; o novo manda o relatório
    // direto. Os dois interessam.
    const r = corpo["csp-report"] ?? corpo;
    console.log("[csp] violação", {
      diretiva: r["violated-directive"] ?? r.effectiveDirective,
      bloqueado: String(r["blocked-uri"] ?? r.blockedURL ?? "").slice(0, 200),
      pagina: String(r["document-uri"] ?? r.documentURL ?? "").slice(0, 200),
    });
  } catch {
    /* relatório malformado: ignorar, não é caminho de usuário */
  }
  // 204: o navegador não espera corpo nenhum.
  return new NextResponse(null, { status: 204 });
}
