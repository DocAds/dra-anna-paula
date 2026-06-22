"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { depoimentos } from "@/lib/depoimentos";

export function Depoimentos() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  if (!depoimentos.length) return null;

  const scroll = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.85, 440);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="relative py-28 md:py-32 bg-porcelain overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between mb-12">
          <SectionHeading
            eyebrow="Depoimentos"
            title={
              <>
                O que as pacientes
                <br /> dizem sobre o cuidado.
              </>
            }
          />
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Depoimento anterior"
              onClick={() => scroll(-1)}
              className="grid h-12 w-12 place-items-center rounded-full border border-cocoa/30 text-cocoa transition-all duration-500 hover:bg-cocoa hover:text-bone"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Próximo depoimento"
              onClick={() => scroll(1)}
              className="grid h-12 w-12 place-items-center rounded-full border border-cocoa/30 text-cocoa transition-all duration-500 hover:bg-cocoa hover:text-bone"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-[max(1.5rem,calc((100vw-80rem)/2))]"
      >
        {depoimentos.map((d, i) => (
          <motion.article
            key={`${d.iniciais}-${i}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.6,
              delay: (i % 4) * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="snap-start shrink-0 w-[290px] md:w-[370px] editorial-card rounded-3xl p-8 flex flex-col"
          >
            <Quote className="h-7 w-7 text-cocoa/30" />
            <div className="mt-5 flex gap-1 text-toffee" aria-label={`${d.nota} de 5 estrelas`}>
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  className="h-4 w-4"
                  fill={s < d.nota ? "currentColor" : "none"}
                  strokeWidth={s < d.nota ? 0 : 1.5}
                />
              ))}
            </div>
            <p className="mt-5 text-ink/75 leading-relaxed flex-1">{d.texto}</p>
            <footer className="mt-7 flex items-center gap-3 border-t border-cocoa/15 pt-5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-cocoa/10 font-display text-cocoa">
                {d.iniciais}
              </span>
              <span className="text-[11px] uppercase tracking-widest2 text-ink/55">
                Paciente · Google
              </span>
            </footer>
          </motion.article>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-ink/45 italic">
          Depoimentos espontâneos de pacientes, publicados com identidade preservada (apenas
          iniciais). Em respeito à ética médica, não há promessa de resultado nem imagens de
          antes e depois: cada caso é único e avaliado individualmente.
        </p>
      </div>
    </section>
  );
}
