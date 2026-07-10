import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { LiquidBackdrop } from "@/components/LiquidBackdrop";
import { CTA } from "@/components/CTA";
import { SITE } from "@/lib/site";
import { openGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a Dra. Anna Bomtempo coleta, usa e protege seus dados pessoais, e quais são os seus direitos sob a LGPD.",
  alternates: { canonical: "/privacidade" },
  openGraph: openGraph({
    title: "Política de Privacidade · Dra. Anna Bomtempo",
    description: "Como seus dados pessoais são coletados, usados e protegidos, sob a LGPD.",
    path: "/privacidade",
  }),
};

const ATUALIZADA_EM = "junho de 2026";

const OPERADORES = [
  ["Supabase", "Banco de dados onde os contatos ficam armazenados com segurança."],
  ["Vercel", "Hospedagem do site."],
  ["Meta (Facebook/Instagram)", "Pixel e Conversions API para mensuração de anúncios."],
  ["Google", "Google Analytics e Google Ads para análise e mensuração de campanhas."],
  ["TikTok", "Pixel para mensuração de anúncios, quando ativo."],
] as const;

const DIREITOS = [
  "Confirmar se tratamos seus dados e acessá-los.",
  "Corrigir dados incompletos ou desatualizados.",
  "Solicitar a exclusão dos seus dados.",
  "Revogar o consentimento a qualquer momento.",
  "Pedir informação sobre com quem compartilhamos seus dados.",
] as const;

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="editorial-card rounded-3xl p-8 md:p-10">
      <h2 className="font-display text-2xl md:text-3xl text-ink mb-4">{titulo}</h2>
      <div className="space-y-3 text-ink/70 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  return (
    <>
      <section className="relative pt-40 pb-16 overflow-hidden">
        <LiquidBackdrop variant="cream" />
        <div className="mx-auto max-w-3xl px-6 relative">
          <Reveal>
            <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6 flex items-center gap-3">
              <span className="h-px w-12 bg-toffee/60" /> Transparência
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="font-display text-[clamp(2.2rem,6vw,4.2rem)] leading-[1] text-ink text-balance">
              Política de <span className="italic text-cocoa">Privacidade</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-lg leading-relaxed text-ink/70">
              Seu cuidado começa pela confiança. Aqui explicamos, de forma direta, quais
              dados coletamos, por que usamos e como você mantém o controle sobre eles.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-3 text-xs uppercase tracking-widest2 text-ink/45">
              Atualizada em {ATUALIZADA_EM}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-28">
        <div className="mx-auto max-w-3xl px-6 grid gap-6">
          <Bloco titulo="Quem é responsável">
            <p>
              Este site é do consultório da {SITE.name} ({SITE.crm} · {SITE.rqe}),
              {" "}com atendimento em {SITE.enderecos.map((e) => e.bairro).join(" e ")}, em São Paulo.
              Para qualquer assunto sobre seus dados, fale com a gente pelo e-mail{" "}
              <a href={`mailto:${SITE.email}`} className="underline-editorial text-cocoa">
                {SITE.email}
              </a>.
            </p>
          </Bloco>

          <Bloco titulo="Quais dados coletamos">
            <p>
              Quando você preenche um formulário ou nos chama no WhatsApp, coletamos os
              dados que você informa: nome, WhatsApp, e-mail, cidade, o tratamento de
              interesse, a urgência e a sua mensagem.
            </p>
            <p>
              Automaticamente, ao navegar, registramos dados técnicos como endereço IP,
              país/cidade aproximados, tipo de navegador e parâmetros de origem da visita
              (campanhas e cliques de anúncio). O tratamento de interesse pode revelar
              informação de saúde, por isso só o tratamos com o seu consentimento.
            </p>
          </Bloco>

          <Bloco titulo="Por que usamos">
            <p>Usamos seus dados para:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>entrar em contato e agendar a sua avaliação;</li>
              <li>mensurar e melhorar nossas campanhas e anúncios;</li>
              <li>entender o uso do site por meio de estatísticas.</li>
            </ul>
            <p>
              As bases legais são o seu consentimento (para contato, marketing e cookies
              não essenciais) e o legítimo interesse (para a segurança e o funcionamento
              do site).
            </p>
          </Bloco>

          <Bloco titulo="Com quem compartilhamos">
            <p>
              Não vendemos seus dados. Para operar o site e as campanhas, contamos com
              parceiros de tecnologia e marketing, que tratam os dados em nosso nome:
            </p>
            <ul className="space-y-2">
              {OPERADORES.map(([nome, desc]) => (
                <li key={nome} className="grid gap-0.5">
                  <span className="text-ink font-medium">{nome}</span>
                  <span className="text-sm text-ink/60">{desc}</span>
                </li>
              ))}
            </ul>
          </Bloco>

          <Bloco titulo="Cookies e rastreamento">
            <p>
              Usamos cookies necessários para o site funcionar e, mediante o seu
              consentimento, cookies de análise e de marketing. Você escolhe o que aceitar
              no aviso de cookies e pode mudar a decisão quando quiser, limpando os cookies
              do seu navegador ou falando com a gente.
            </p>
          </Bloco>

          <Bloco titulo="Por quanto tempo guardamos">
            <p>
              Mantemos seus dados de contato pelo tempo necessário para o atendimento e
              enquanto durar o relacionamento, salvo obrigação legal de guarda. Depois
              disso, os dados são excluídos ou anonimizados.
            </p>
          </Bloco>

          <Bloco titulo="Seus direitos">
            <p>Sob a LGPD, você pode a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {DIREITOS.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <p>
              Para exercer qualquer um deles, escreva para{" "}
              <a href={`mailto:${SITE.email}`} className="underline-editorial text-cocoa">
                {SITE.email}
              </a>. Respondemos no menor prazo possível.
            </p>
          </Bloco>
        </div>
      </section>

      <section className="pb-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <CTA source="privacidade-final">Ficou com alguma dúvida? Fale com a gente</CTA>
        </div>
      </section>
    </>
  );
}
