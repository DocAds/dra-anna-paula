import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { LiquidBackdrop } from "@/components/LiquidBackdrop";

export const metadata: Metadata = { title: "Diário · Blog" };

const posts = [
  { t: "Descomplicando os rótulos de skincare", c: "Skincare" },
  { t: "Vitamina C: o pilar invisível da pele radiante", c: "Skincare" },
  { t: "O sono da beleza existe", c: "Lifestyle" },
  { t: "Pele saudável em um mundo em mudança", c: "Saúde" },
  { t: "Sua pele está pagando o preço do estresse?", c: "Saúde" },
  { t: "Liftera e a revolução do ultrassom microfocado", c: "Tecnologia" },
  { t: "A importância da consulta médica antes de procedimentos estéticos", c: "Medicina" },
  { t: "Guia completo: rotina de skincare por tipo de pele", c: "Skincare" },
  { t: "Mitos e verdades do skincare", c: "Skincare" },
  { t: "Pele de pêssego: o que a dieta tem a ver com isso", c: "Nutrição" },
  { t: "Diga adeus às manchas com Fotona StarWalker", c: "Tecnologia" },
];

export default function BlogPage() {
  return (
    <>
      <section className="relative pt-40 pb-20 overflow-hidden">
        <LiquidBackdrop variant="cream" />
        <div className="mx-auto max-w-5xl px-6 relative">
          <Reveal>
            <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6 flex items-center gap-3">
              <span className="h-px w-12 bg-toffee/60" /> Diário
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="font-display text-[clamp(2.4rem,7vw,5.4rem)] leading-[0.98] text-ink text-balance">
              Estudos, anotações e <span className="italic text-cocoa">cuidados</span> assinados pela Dra. Anna.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="relative pb-32">
        <div className="mx-auto max-w-5xl px-6 grid gap-3">
          {posts.map((p, i) => (
            <Reveal key={p.t} delay={(i % 4) * 0.06}>
              <article className="group editorial-card rounded-3xl p-6 md:p-8 grid md:grid-cols-12 items-center gap-6 hover:-translate-y-0.5 transition-all duration-700">
                <div className="md:col-span-2 text-[10px] uppercase tracking-widest3 text-toffee">
                  {p.c}
                </div>
                <h2 className="md:col-span-8 font-display text-xl md:text-2xl text-ink leading-snug">
                  {p.t}
                </h2>
                <div className="md:col-span-2 md:text-right text-[12px] uppercase tracking-widest2 text-cocoa group-hover:translate-x-1 transition-transform duration-500">
                  Em breve →
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
