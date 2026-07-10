import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { SectionHeading } from "@/components/SectionHeading";
import { CTA } from "@/components/CTA";
import { tratamentos, grupos } from "@/lib/tratamentos";
import { openGraph } from "@/lib/seo";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Tratamentos",
  description:
    "Tecnologia premium para dermatologia clínica e rejuvenescimento. Ultraformer MPT, Volnewmer, CO₂ fracionado, Fotona e injetáveis.",
  alternates: { canonical: "/tratamentos" },
  openGraph: openGraph({
    title: "Tratamentos · Dra. Anna Bomtempo",
    description:
      "Tecnologia premium para dermatologia clínica e rejuvenescimento, na Vila Olímpia, São Paulo.",
    path: "/tratamentos",
  }),
};

const txImg = (slug: string) => `/img/bg/tx-${slug}-1200.webp`;

export default function TratamentosPage() {
  return (
    <>
      <section className="relative pt-40 pb-24 overflow-hidden">
        <SceneBackdrop scene="botanical" intensity={0.55} />
        <div className="mx-auto max-w-5xl px-6 relative">
          <Reveal>
            <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6 flex items-center gap-3">
              <span className="h-px w-12 bg-toffee/60" /> Tratamentos
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="font-display text-[clamp(2.4rem,7vw,5.4rem)] leading-[0.98] text-ink text-balance">
              Tecnologia premium,{" "}
              <span className="italic text-cocoa">indicação certa</span>.
            </h1>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="mt-6 text-lg leading-relaxed text-ink/70 max-w-2xl">
              Plataformas de ponta combinadas com método próprio de avaliação.
              A escolha do procedimento parte do diagnóstico — não do contrário.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative py-12 bg-porcelain">
        <div className="mx-auto max-w-7xl px-6 grid gap-6 md:grid-cols-3">
          {grupos.map((g, i) => {
            const count = tratamentos.filter((t) => t.grupo === g.slug).length;
            return (
              <Reveal key={g.slug} delay={i * 0.08}>
                <a
                  href={`#${g.slug}`}
                  className="group relative block rounded-3xl overflow-hidden aspect-[5/3] bg-cream"
                >
                  <Image
                    src={g.img}
                    alt={g.titulo}
                    fill
                    sizes="(min-width: 768px) 30vw, 90vw"
                    className="object-cover transition-transform duration-[1500ms] ease-editorial group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                    <div className="text-[10px] uppercase tracking-widest3 text-cream/70 mb-1">
                      {count.toString().padStart(2, "0")} tratamentos
                    </div>
                    <h2 className="font-display text-2xl leading-tight">{g.titulo}</h2>
                    <p className="text-cream/75 text-sm mt-1">{g.sub}</p>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
      </section>

      {grupos.map((g) => {
        const lista = tratamentos.filter((t) => t.grupo === g.slug);
        if (!lista.length) return null;
        return (
          <section key={g.slug} id={g.slug} className="relative py-20 scroll-mt-24">
            <div className="mx-auto max-w-7xl px-6">
              <Reveal>
                <div className="flex items-end justify-between gap-6 mb-12 border-b border-cocoa/15 pb-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-3">
                      {g.sub}
                    </div>
                    <h2 className="font-display text-4xl md:text-5xl text-ink leading-tight">
                      {g.titulo}
                    </h2>
                  </div>
                  <span className="text-[11px] uppercase tracking-widest2 text-ink/55">
                    {lista.length.toString().padStart(2, "0")} tratamentos
                  </span>
                </div>
              </Reveal>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {lista.map((t, i) => (
                  <Reveal key={t.slug} delay={(i % 3) * 0.08}>
                    <Link
                      href={`/tratamentos/${t.slug}`}
                      className="group block rounded-3xl overflow-hidden bg-cream transition-all duration-700 hover:-translate-y-1"
                    >
                      <div className="relative aspect-[5/4] overflow-hidden">
                        <Image
                          src={txImg(t.slug)}
                          alt={t.nome}
                          fill
                          sizes="(min-width: 1024px) 30vw, 80vw"
                          className="object-cover transition-transform duration-[1500ms] ease-editorial group-hover:scale-[1.05]"
                        />
                      </div>
                      <div className="p-7">
                        <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-3">
                          {t.categoria}
                        </div>
                        <h3 className="font-display text-2xl text-ink mb-2 leading-tight">
                          {t.nome}
                        </h3>
                        <p className="text-cocoa italic font-serif text-sm mb-4">
                          {t.subtitulo}
                        </p>
                        <p className="text-ink/65 text-sm leading-relaxed line-clamp-2">
                          {t.resumo}
                        </p>
                        <div className="mt-5 flex items-center justify-between border-t border-cocoa/15 pt-4">
                          <span className="text-[11px] uppercase tracking-widest2 text-ink/55">
                            {t.sessoes}
                          </span>
                          <span className="text-cocoa transition-transform duration-500 group-hover:translate-x-1">
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <section className="relative py-28 md:py-36 bg-bone">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Como funciona"
              title="Sua avaliação, em três passos."
            />
          </Reveal>
          <div className="mt-16 grid gap-8 md:grid-cols-3 text-left">
            {[
              { n: "01", t: "Anamnese", d: "Histórico, rotina, expectativas e contraindicações." },
              { n: "02", t: "Diagnóstico", d: "Análise da pele e proposição de plano clínico individualizado." },
              { n: "03", t: "Plano de tratamento", d: "Protocolo, cronograma e manutenção, sempre revisado em cada retorno." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.12}>
                <div className="editorial-card rounded-3xl p-7 h-full">
                  <div className="font-display text-4xl text-cocoa mb-4">{s.n}</div>
                  <h3 className="font-display text-2xl text-ink mb-3">{s.t}</h3>
                  <p className="text-ink/65 leading-relaxed text-sm">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.5} className="mt-14">
            <CTA source="tratamentos-final">Marcar avaliação</CTA>
          </Reveal>
        </div>
      </section>
    </>
  );
}
