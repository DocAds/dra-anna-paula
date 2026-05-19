import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { Parallax } from "@/components/Parallax";
import { CTA } from "@/components/CTA";
import { tratamentos, tratamentoBySlug } from "@/lib/tratamentos";
import { Clock, CalendarRange, Repeat, ArrowRight, Check } from "lucide-react";

type Params = { params: Promise<{ slug: string }> };

const txImg = (slug: string, w = 1600) => `/img/bg/tx-${slug}-${w}.webp`;

export async function generateStaticParams() {
  return tratamentos.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const t = tratamentoBySlug(slug);
  if (!t) return { title: "Tratamento" };
  return {
    title: t.nome,
    description: `${t.subtitulo}. ${t.promessa}`,
  };
}

export default async function TratamentoPage({ params }: Params) {
  const { slug } = await params;
  const t = tratamentoBySlug(slug);
  if (!t) return notFound();

  const relacionados = tratamentos
    .filter((x) => x.slug !== t.slug && x.grupo === t.grupo)
    .slice(0, 3);
  const fallback = tratamentos.filter((x) => x.slug !== t.slug).slice(0, 3);
  const outros = relacionados.length >= 2 ? relacionados : fallback;

  return (
    <>
      <section className="relative pt-32 pb-20 overflow-hidden bg-porcelain">
        <div className="mx-auto max-w-7xl px-6 grid gap-14 lg:grid-cols-12 items-start relative">
          <div className="lg:col-span-6 z-10 lg:pt-12">
            <Reveal>
              <Link
                href="/tratamentos"
                className="text-[11px] uppercase tracking-widest3 text-toffee inline-flex items-center gap-2 mb-8"
              >
                ← {t.grupo} · {t.categoria}
              </Link>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="font-display text-[clamp(2.6rem,7vw,5.6rem)] leading-[0.98] text-ink text-balance">
                {t.nome}
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-4 font-serif italic text-2xl md:text-3xl text-cocoa text-balance">
                {t.subtitulo}.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <p className="mt-8 text-lg leading-relaxed text-ink/75 max-w-2xl">
                {t.resumo}
              </p>
            </Reveal>
            <Reveal delay={0.5} className="mt-10 grid gap-4 sm:grid-cols-3 max-w-lg">
              <Info icon={Clock} label="Duração" value={t.duracao} />
              <Info icon={CalendarRange} label="Sessões" value={t.sessoes} />
              <Info icon={Repeat} label="Retorno" value={t.retorno} />
            </Reveal>
            <Reveal delay={0.65} className="mt-10 flex flex-wrap gap-3">
              <CTA source={`tratamento-${t.slug}`}>Agendar {t.nome}</CTA>
              <CTA
                source={`tratamento-${t.slug}-saiba`}
                href="/sobre"
                variant="outline"
              >
                Conhecer a Dra.
              </CTA>
            </Reveal>
          </div>

          <div className="lg:col-span-6">
            <Parallax offset={30}>
              <Reveal delay={0.25}>
                <div className="relative aspect-[4/5] w-full max-w-lg mx-auto">
                  <div className="absolute inset-0 rounded-[28px] overflow-hidden bg-cream">
                    <Image
                      src={txImg(t.slug)}
                      alt={t.nome}
                      fill
                      priority
                      sizes="(min-width: 1024px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-6 -left-6 editorial-card rounded-2xl px-6 py-5 max-w-[260px]">
                    <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-1">
                      Promessa
                    </div>
                    <div className="font-display text-base text-ink leading-tight">
                      {t.promessa}
                    </div>
                  </div>
                </div>
              </Reveal>
            </Parallax>
          </div>
        </div>
      </section>

      <section className="relative py-24 md:py-28 bg-bone">
        <div className="mx-auto max-w-6xl px-6 grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6">
                Indicações
              </div>
              <h2 className="font-display text-4xl md:text-5xl leading-tight text-ink text-balance mb-8">
                Para quem este protocolo foi pensado.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="lg:col-span-7">
            <ul className="grid gap-4 sm:grid-cols-2">
              {t.indicacoes.map((ind) => (
                <li key={ind} className="flex items-start gap-3 text-ink/75">
                  <Check className="h-5 w-5 text-cocoa shrink-0 mt-0.5" />
                  <span className="text-base leading-relaxed">{ind}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="relative py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6">
              Como funciona
            </div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight text-ink text-balance mb-16 max-w-2xl">
              Cada etapa, conduzida com método clínico.
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            {t.comoFunciona.map((step, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="editorial-card rounded-3xl p-7 h-full">
                  <div className="font-display text-4xl text-cocoa mb-4">
                    {(i + 1).toString().padStart(2, "0")}
                  </div>
                  <p className="text-ink/75 leading-relaxed">{step}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-cocoa text-cream overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          aria-hidden
          style={{
            background:
              "radial-gradient(50% 50% at 80% 30%, rgba(231,222,208,0.22), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="text-[11px] uppercase tracking-widest3 text-cream/55 mb-6">
                Diferenciais
              </div>
              <h2 className="font-display text-4xl md:text-5xl leading-tight text-cream text-balance">
                O que torna esse protocolo diferente.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="lg:col-span-7 space-y-6">
            {t.diferenciais.map((d, i) => (
              <div
                key={d}
                className="border-b border-cream/15 pb-5 flex gap-5"
              >
                <div className="font-display text-2xl text-cream/60">
                  {(i + 1).toString().padStart(2, "0")}
                </div>
                <p className="text-cream/85 leading-relaxed">{d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="relative py-28">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6 text-center">
              Perguntas frequentes
            </div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight text-ink text-balance text-center mb-14">
              O que você precisa saber.
            </h2>
          </Reveal>
          <div className="space-y-3">
            {t.faq.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.08}>
                <details className="group editorial-card rounded-3xl p-7 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="cursor-pointer flex items-start justify-between gap-6">
                    <span className="font-display text-xl text-ink">
                      {f.q}
                    </span>
                    <span className="mt-1 text-cocoa transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-5 text-ink/70 leading-relaxed">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-28 bg-bone">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-3">
                  {t.grupo} · Outros tratamentos
                </div>
                <h2 className="font-display text-4xl md:text-5xl text-ink leading-tight text-balance">
                  Combinações que fazem sentido.
                </h2>
              </div>
              <Link
                href="/tratamentos"
                className="text-[12px] uppercase tracking-widest2 text-cocoa underline-editorial inline-flex items-center gap-2"
              >
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {outros.map((o, i) => (
              <Reveal key={o.slug} delay={i * 0.1}>
                <Link
                  href={`/tratamentos/${o.slug}`}
                  className="group block rounded-3xl overflow-hidden bg-cream hover:-translate-y-1 transition-all duration-700"
                >
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <Image
                      src={txImg(o.slug, 1200)}
                      alt={o.nome}
                      fill
                      sizes="(min-width: 1024px) 30vw, 80vw"
                      className="object-cover transition-transform duration-[1500ms] ease-editorial group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="p-6">
                    <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">
                      {o.categoria}
                    </div>
                    <h3 className="font-display text-2xl text-ink mb-2">
                      {o.nome}
                    </h3>
                    <p className="text-sm text-ink/65 leading-relaxed line-clamp-2">
                      {o.resumo}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <h2 className="font-display text-[clamp(2.2rem,5.5vw,4rem)] leading-tight text-ink text-balance">
              Pronta para entender se o {t.nome} é para você?
            </h2>
          </Reveal>
          <Reveal delay={0.2} className="mt-8">
            <CTA source={`tratamento-${t.slug}-final`}>
              Agendar avaliação
            </CTA>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="border-l-2 border-cocoa/30 pl-4">
      <div className="flex items-center gap-2 text-cocoa mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] uppercase tracking-widest3">{label}</span>
      </div>
      <div className="text-ink text-sm font-medium leading-tight">{value}</div>
    </div>
  );
}
