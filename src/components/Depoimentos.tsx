"use client";

import { useRef, useEffect, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { depoimentos } from "@/lib/depoimentos";

const GAP = 24; // px (corresponde a gap-6)

export function Depoimentos() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rafRef = useRef(0);
  const lockRef = useRef(false);

  // Triplica a lista para criar a sensação de loop infinito.
  const base = depoimentos;
  const loop = base.length ? [...base, ...base, ...base] : [];

  const applyEdgeScale = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const cards = el.querySelectorAll<HTMLElement>("[data-card]");
    cards.forEach((c) => {
      if (reduce) {
        c.style.transform = "";
        c.style.opacity = "";
        return;
      }
      const cr = c.getBoundingClientRect();
      const cardCenter = cr.left + cr.width / 2;
      const max = rect.width / 2 + cr.width / 2;
      const t = Math.min(Math.abs(cardCenter - center) / max, 1); // 0 centro, 1 ponta
      const scale = 1 - t * 0.2;
      const opacity = 1 - t * 0.55;
      c.style.transform = `scale(${scale.toFixed(3)})`;
      c.style.opacity = opacity.toFixed(3);
    });
  }, [reduce]);

  const oneSet = () => {
    const el = trackRef.current;
    return el ? el.scrollWidth / 3 : 0;
  };

  const normalize = useCallback(() => {
    const el = trackRef.current;
    if (!el || lockRef.current) return;
    const set = oneSet();
    if (set <= 0) return;
    if (el.scrollLeft < set * 0.5) {
      lockRef.current = true;
      el.scrollLeft += set;
      lockRef.current = false;
    } else if (el.scrollLeft > set * 1.5) {
      lockRef.current = true;
      el.scrollLeft -= set;
      lockRef.current = false;
    }
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !base.length) return;

    // Começa no conjunto do meio.
    el.scrollLeft = oneSet();
    applyEdgeScale();

    const onScroll = () => {
      normalize();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(applyEdgeScale);
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    // Clica e arrasta (mouse). Touch usa o scroll nativo.
    let down = false;
    let startX = 0;
    let startLeft = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      el.scrollLeft = startLeft - (e.clientX - startX);
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      el.style.cursor = "grab";
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    const onResize = () => {
      el.scrollLeft = oneSet();
      applyEdgeScale();
    };
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [applyEdgeScale, normalize, base.length]);

  const step = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + GAP : el.clientWidth * 0.25;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!base.length) return null;

  return (
    <section className="relative py-28 md:py-32 bg-porcelain overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between mb-12">
          <Reveal>
            <SectionHeading
              eyebrow="Depoimentos"
              title={
                <>
                  O que as pacientes
                  <br /> dizem sobre o cuidado.
                </>
              }
            />
          </Reveal>
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Depoimento anterior"
              onClick={() => step(-1)}
              className="grid h-12 w-12 place-items-center rounded-full border border-cocoa/30 text-cocoa transition-all duration-500 hover:bg-cocoa hover:text-bone"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Próximo depoimento"
              onClick={() => step(1)}
              className="grid h-12 w-12 place-items-center rounded-full border border-cocoa/30 text-cocoa transition-all duration-500 hover:bg-cocoa hover:text-bone"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto select-none cursor-grab px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:px-[max(1.5rem,calc((100vw-80rem)/2))]"
        style={{ touchAction: "pan-x" }}
      >
        {loop.map((d, i) => (
          <article
            key={`${d.iniciais}-${i}`}
            data-card
            className="shrink-0 w-[82%] sm:w-[46%] lg:w-[calc((100%-4.5rem)/4)] editorial-card rounded-3xl p-8 flex flex-col will-change-transform"
            style={{ transition: "transform 200ms ease-out, opacity 200ms ease-out", transformOrigin: "center" }}
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
          </article>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-ink/45 italic">
          Depoimentos espontâneos de pacientes, publicados com identidade preservada (apenas
          iniciais). Em respeito à ética médica, não há promessa de resultado nem imagens de
          antes e depois: cada caso é único e avaliado individualmente.
        </p>
      </div>
    </section>
  );
}
