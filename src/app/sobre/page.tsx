import Image from "next/image";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { LiquidBackdrop } from "@/components/LiquidBackdrop";
import { Parallax } from "@/components/Parallax";
import { SectionHeading } from "@/components/SectionHeading";
import { CTA } from "@/components/CTA";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "A Dra. Anna",
  description:
    "Dermatologista formada pela UFU com prática em clínica, cirúrgica e estética. CRM 177.888 · RQE 85.823.",
};

export default function SobrePage() {
  return (
    <>
      <section className="relative pt-40 pb-28 overflow-hidden">
        <LiquidBackdrop variant="cream" />
        <div className="mx-auto max-w-7xl px-6 grid gap-14 lg:grid-cols-12 items-center relative">
          <div className="lg:col-span-6 z-10">
            <Reveal>
              <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6 flex items-center gap-3">
                <span className="h-px w-12 bg-toffee/60" /> A Dra. Anna
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="font-display text-[clamp(2.4rem,7vw,5.2rem)] leading-[0.98] text-ink text-balance">
                Dermatologia conduzida com{" "}
                <span className="italic text-cocoa">presença</span>.
              </h1>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-8 text-lg leading-relaxed text-ink/75 max-w-xl">
                A Dra. Anna Paula Bomtempo é médica dermatologista formada pela
                Universidade Federal de Uberlândia, com prática em dermatologia
                clínica, cirúrgica e estética. Acredita em uma medicina que
                escuta antes de prescrever, e em uma estética que respeita o
                tempo natural de cada pele.
              </p>
            </Reveal>
            <Reveal delay={0.45} className="mt-10 flex flex-wrap gap-3 text-[11px] uppercase tracking-widest3 text-cocoa">
              <span className="rounded-full border border-cocoa/30 px-4 py-2">CRM 177.888</span>
              <span className="rounded-full border border-cocoa/30 px-4 py-2">RQE 85.823</span>
              <span className="rounded-full border border-cocoa/30 px-4 py-2">+8 anos de prática</span>
            </Reveal>
            <Reveal delay={0.6} className="mt-10">
              <CTA source="sobre-hero">Marcar uma avaliação</CTA>
            </Reveal>
          </div>

          <div className="lg:col-span-6 relative">
            <Parallax offset={40}>
              <Reveal delay={0.2}>
                <div className="relative grid grid-cols-6 grid-rows-6 gap-3 aspect-square max-w-xl ml-auto">
                  <div className="col-span-4 row-span-4 relative rounded-[28px] overflow-hidden editorial-card p-2">
                    <div className="relative h-full w-full rounded-[20px] overflow-hidden bg-cream">
                      <Image
                        src="/img/dra/dra-principal-1440.webp"
                        alt="Dra. Anna Paula Bomtempo"
                        fill
                        priority
                        sizes="(min-width: 1024px) 36vw, 80vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 col-start-5 row-span-2 row-start-1 relative rounded-[20px] overflow-hidden">
                    <Image src="/img/dra/dra-3-960.webp" alt="" fill sizes="200px" className="object-cover" />
                  </div>
                  <div className="col-span-2 col-start-5 row-span-2 row-start-3 relative rounded-[20px] overflow-hidden glass-dark p-2">
                    <div className="grid h-full w-full place-items-center text-cream text-center">
                      <div>
                        <div className="font-display text-3xl">2023</div>
                        <div className="text-[10px] uppercase tracking-widest3 text-cream/70">
                          Início da clínica própria
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 col-start-1 row-span-2 row-start-5 relative rounded-[20px] overflow-hidden">
                    <Image src="/img/dra/dra-4-960.webp" alt="" fill sizes="200px" className="object-cover" />
                  </div>
                  <div className="col-span-3 col-start-4 row-span-2 row-start-5 relative rounded-[20px] overflow-hidden">
                    <Image src="/img/dra/dra-5-960.webp" alt="" fill sizes="200px" className="object-cover" />
                  </div>
                </div>
              </Reveal>
            </Parallax>
          </div>
        </div>
      </section>

      <section className="relative py-28 md:py-36 bg-bone">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Filosofia"
              title={<>Quiet beauty.<br /> Saúde como prática contínua.</>}
              description="Nenhum procedimento substitui o cuidado diário. Cada protocolo é construído junto com a rotina, o histórico e os objetivos da paciente."
            />
          </Reveal>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              {
                t: "Escuta clínica",
                d: "Tempo dedicado em cada consulta. Entender expectativas é o primeiro passo do tratamento.",
              },
              {
                t: "Naturalidade primeiro",
                d: "O objetivo é parecer a sua melhor versão, não outra pessoa. Sem excessos.",
              },
              {
                t: "Continuidade",
                d: "Acompanhamento próximo entre sessões. A pele tem ritmo e o plano se adapta a ela.",
              },
            ].map((b, i) => (
              <Reveal key={b.t} delay={i * 0.15}>
                <div className="border-t border-cocoa/20 pt-8">
                  <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-3">
                    0{i + 1}
                  </div>
                  <h3 className="font-display text-2xl text-ink mb-3">{b.t}</h3>
                  <p className="text-ink/65 leading-relaxed">{b.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-28 md:py-36">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Trajetória"
              title="Formação e prática."
            />
          </Reveal>
          <div className="mt-14 space-y-8">
            {[
              {
                ano: "Atual",
                titulo: "Consultório próprio em São Paulo",
                desc: "Atendimento em duas unidades, Vila Olímpia e Jardim Paulista, com foco em dermatologia clínica e rejuvenescimento facial.",
              },
              {
                ano: "Especialização",
                titulo: "Dermatologia clínica, cirúrgica e estética",
                desc: "Título de Especialista em Dermatologia · RQE 85.823.",
              },
              {
                ano: "Graduação",
                titulo: "Universidade Federal de Uberlândia — MG",
                desc: "Formação médica com base sólida em clínica e pesquisa.",
              },
            ].map((b, i) => (
              <Reveal key={b.titulo} delay={i * 0.12}>
                <div className="grid gap-3 md:grid-cols-12 border-b border-cocoa/15 pb-8">
                  <div className="md:col-span-3 text-[11px] uppercase tracking-widest3 text-toffee mt-2">
                    {b.ano}
                  </div>
                  <div className="md:col-span-9">
                    <h3 className="font-display text-2xl text-ink mb-2">{b.titulo}</h3>
                    <p className="text-ink/65 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-28 md:py-36 bg-cocoa text-cream overflow-hidden">
        <div className="absolute inset-0 opacity-30" aria-hidden style={{
          background:
            "radial-gradient(50% 50% at 70% 30%, rgba(231,222,208,0.25), transparent 70%)",
        }} />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <h2 className="font-display text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.02] text-cream text-balance">
              A consulta começa <span className="italic">antes</span> de você sentar.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-cream/75 max-w-2xl mx-auto text-lg">
              Cada agendamento inclui uma anamnese aprofundada, análise da rotina
              e construção de plano individualizado. A medicina aqui é exercida com calma.
            </p>
          </Reveal>
          <Reveal delay={0.35} className="mt-10">
            <CTA source="sobre-final">Agendar com a Dra. Anna</CTA>
          </Reveal>
          <Reveal delay={0.5} className="mt-10 text-[11px] uppercase tracking-widest3 text-cream/60">
            {SITE.crm} · {SITE.rqe}
          </Reveal>
        </div>
      </section>
    </>
  );
}
