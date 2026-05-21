import Image from "next/image";
import Link from "next/link";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { Reveal, RevealText } from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";
import { SectionHeading } from "@/components/SectionHeading";
import { CTA } from "@/components/CTA";
import { Parallax } from "@/components/Parallax";
import { tratamentos, grupos, stats, tecnologiasParceiras, type Categoria } from "@/lib/tratamentos";
import { SITE } from "@/lib/site";
import {
  Sparkles,
  Hand,
  Microscope,
  HeartHandshake,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  GraduationCap,
  Award,
  Instagram,
} from "lucide-react";

const txImg = (slug: string) => `/img/bg/tx-${slug}-1200.webp`;

export default function HomePage() {
  const destaques = tratamentos.filter((t) => t.destaque).slice(0, 6);
  const signature = tratamentos.find((t) => t.slug === "ultraformer-mpt")!;

  return (
    <>
      <Hero />
      <RibbonTecnologias />
      <Welcome />
      <Categorias />
      <Pilares />
      <TratamentosGrid destaques={destaques} />
      <Signature t={signature} />
      <Dra />
      <Stats />
      <Confianca />
      <Insights />
      <InstagramFeed />
      <Localizacao />
      <CTAFinal />
    </>
  );
}

function Hero() {
  return (
    <>
      <HeroMobile />
      <HeroDesktop />
    </>
  );
}

function HeroMobile() {
  return (
    <section className="lg:hidden relative flex min-h-[100svh] flex-col overflow-hidden bg-bone">
      <div className="relative flex-1 min-h-[34svh] w-full">
        <Image
          src="/img/dra/dra-hero-1440.webp"
          alt="Dra. Anna Paula Bomtempo"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_8%]"
        />
        {/* Scrim no topo para leitura do menu flutuante */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/35 via-ink/5 to-transparent" />
        {/* Degradê de conexão: funde a foto no fundo bone, onde o texto começa */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-45% via-bone/80 via-85% to-bone" />
      </div>

      <div className="relative z-10 -mt-10 px-6 pb-8">
        <Reveal>
          <div className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-widest3 text-toffee [text-shadow:0_1px_10px_rgba(245,239,230,0.95)]">
            <span className="h-px w-10 bg-toffee/60" />
            <span>Dermatologia · São Paulo</span>
          </div>
        </Reveal>

        <h1 className="font-display text-[clamp(1.9rem,8.2vw,3.2rem)] leading-[1.06] tracking-tight text-ink text-balance">
          A medicina da pele,
          <span className="block italic font-serif text-cocoa">conduzida com tempo.</span>
        </h1>

        <Reveal delay={0.2}>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink/75">
            Rejuvenescimento facial, lasers e protocolos personalizados, com
            resultados naturais.
          </p>
        </Reveal>

        <Reveal delay={0.35} className="mt-6 flex flex-col gap-3">
          <CTA source="hero">Agendar avaliação</CTA>
          <CTA source="hero" href="/tratamentos" variant="outline">
            Conhecer tratamentos
          </CTA>
        </Reveal>
      </div>
    </section>
  );
}

function HeroDesktop() {
  const micro = ["Ultraformer MPT", "Volnewmer", "Laser CO₂", "Fotona", "Injetáveis premium", "Skinbooster"];
  return (
    <section className="hidden lg:block relative min-h-screen overflow-hidden pt-28 pb-20">
      <SceneBackdrop scene="drapery" intensity={0.85} />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-12 lg:gap-8 lg:px-12 items-center">
        <div className="lg:col-span-6 lg:pt-10 z-10">
          <Reveal>
            <div className="mb-6 flex items-center gap-3 text-[11px] uppercase tracking-widest3 text-toffee">
              <span className="h-px w-12 bg-toffee/60" />
              <span>Dermatologia · São Paulo</span>
            </div>
          </Reveal>

          <h1 className="font-display text-[clamp(2.6rem,7vw,5.6rem)] leading-[0.98] tracking-tight text-ink text-balance">
            <RevealText text="A medicina da pele," />
            <br />
            <span className="italic font-serif text-cocoa">
              <RevealText text="conduzida com tempo." delay={0.2} />
            </span>
          </h1>

          <Reveal delay={0.55} className="mt-8 max-w-xl">
            <p className="text-lg md:text-xl leading-relaxed text-ink/75">
              Rejuvenescimento facial, lasers e tratamentos personalizados em
              uma experiência discreta, sofisticada e focada em resultados
              naturais. Cada protocolo é desenhado para a sua pele.
            </p>
          </Reveal>

          <Reveal delay={0.75} className="mt-10 flex flex-wrap items-center gap-4">
            <CTA source="hero">Agendar avaliação</CTA>
            <CTA source="hero" href="/tratamentos" variant="outline">
              Conhecer tratamentos
            </CTA>
          </Reveal>

          <Reveal delay={0.95} className="mt-14 max-w-xl border-t border-cocoa/15 pt-8">
            <div className="text-[10px] uppercase tracking-widest3 text-ink/45 mb-4">
              Procedimentos principais
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/75">
              {micro.map((m) => (
                <li key={m} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-cocoa/50" />
                  {m}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="lg:col-span-6 relative">
          <Reveal delay={0.35}>
            <Parallax offset={30}>
              <div className="relative aspect-[3/4] w-full max-w-lg mx-auto">
                <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-latte/50 via-biscotti/30 to-transparent blur-2xl" />
                <div className="absolute inset-0 rounded-[28px] overflow-hidden editorial-card p-2">
                  <div className="relative h-full w-full rounded-[22px] overflow-hidden bg-cream">
                    <Image
                      src="/img/dra/dra-hero-1440.webp"
                      alt="Dra. Anna Paula Bomtempo"
                      fill
                      priority
                      sizes="(min-width: 1024px) 45vw, 85vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="absolute -bottom-6 -left-6 editorial-card rounded-2xl px-5 py-4 max-w-[230px]">
                  <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-1">
                    Atendimento
                  </div>
                  <div className="font-display text-base text-ink leading-tight">
                    Avaliação personalizada com método próprio.
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 glass-dark rounded-2xl px-4 py-3 text-cream">
                  <div className="text-[10px] uppercase tracking-widest3 text-cream/70">
                    CRM
                  </div>
                  <div className="font-display text-lg">177.888</div>
                </div>
              </div>
            </Parallax>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function RibbonTecnologias() {
  return (
    <section className="relative py-12 border-y border-cocoa/10 bg-bone">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="text-[10px] uppercase tracking-widest3 text-toffee text-center mb-6">
            Plataformas e parceiros
          </div>
        </Reveal>
        <Marquee items={tecnologiasParceiras as unknown as string[]} duration={20} />
      </div>
    </section>
  );
}

function Welcome() {
  return (
    <section className="relative py-32 md:py-44 overflow-hidden">
      <SceneBackdrop scene="clay" intensity={0.55} />
      <div className="mx-auto max-w-5xl px-6 relative">
        <Reveal>
          <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-8 flex items-center gap-3">
            <span className="h-px w-12 bg-toffee/60" />
            Manifesto
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="font-display text-3xl md:text-5xl lg:text-6xl leading-[1.1] text-ink text-balance">
            Acreditamos em uma beleza{" "}
            <span className="italic text-cocoa">silenciosa</span>. Aquela que
            ninguém aponta o procedimento, mas todos percebem que algo está em
            equilíbrio.{" "}
            <span className="text-ink/40">
              Pele saudável, tempo respeitado, resultado seu.
            </span>
          </p>
        </Reveal>
        <Reveal delay={0.35} className="mt-12 flex items-center gap-4">
          <span className="editorial-rule flex-1 max-w-[120px]" />
          <span className="font-display italic text-xl text-cocoa">
            Dra. Anna Paula Bomtempo
          </span>
        </Reveal>
      </div>
    </section>
  );
}

function Categorias() {
  return (
    <section className="relative py-28 md:py-36 bg-porcelain">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Áreas de atuação"
            title={
              <>
                Três frentes de cuidado<br />
                com a sua pele.
              </>
            }
            description="Da saúde dérmica essencial à tecnologia mais avançada, cada paciente segue um caminho clínico individualizado."
          />
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {grupos.map((g, i) => {
            const count = tratamentos.filter((t) => t.grupo === g.slug).length;
            return (
              <Reveal key={g.slug} delay={i * 0.12}>
                <Link
                  href={`/tratamentos?grupo=${g.slug}`}
                  className="group relative block rounded-3xl overflow-hidden aspect-[4/5] bg-cream"
                >
                  <Image
                    src={g.img}
                    alt={g.titulo}
                    fill
                    sizes="(min-width: 768px) 30vw, 90vw"
                    className="object-cover transition-transform duration-[1500ms] ease-editorial group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-cream">
                    <div className="text-[10px] uppercase tracking-widest3 text-cream/70 mb-2">
                      {count.toString().padStart(2, "0")} tratamentos
                    </div>
                    <h3 className="font-display text-3xl mb-2 leading-tight">
                      {g.titulo}
                    </h3>
                    <p className="text-cream/80 text-sm">{g.sub}</p>
                    <div className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest2 underline-editorial">
                      Ver tratamentos
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Pilares() {
  const pilares = [
    { icon: Microscope, t: "Diagnóstico aprofundado", d: "Análise clínica da sua pele, histórico, rotina e expectativas antes de qualquer indicação." },
    { icon: Sparkles, t: "Tecnologia certa", d: "Plataformas premium como Ultraformer MPT, Volnewmer, CO₂ e Fotona, escolhidas para o seu caso." },
    { icon: Hand, t: "Técnica delicada", d: "Procedimentos conduzidos pela própria Dra. Anna, com foco em naturalidade." },
    { icon: HeartHandshake, t: "Acompanhamento próximo", d: "Continuidade entre consultas. Pele tem ritmo e cada protocolo é revisado com você." },
  ];
  return (
    <section className="relative py-24 md:py-32 bg-bone">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Princípios"
            title={<>Quatro pilares que orientam<br /> cada protocolo.</>}
            description="A mesma medicina por trás de cada agendamento."
          />
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pilares.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.1}>
              <div className="editorial-card rounded-3xl p-7 h-full">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cocoa/10 text-cocoa">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-2xl text-ink mb-3">{p.t}</h3>
                <p className="text-ink/65 leading-relaxed text-sm">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TratamentosGrid({ destaques }: { destaques: typeof tratamentos }) {
  return (
    <section className="relative py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <Reveal>
            <SectionHeading
              eyebrow="Tratamentos populares"
              title={<>Os protocolos mais procurados<br /> na clínica.</>}
            />
          </Reveal>
          <Reveal delay={0.2}>
            <Link
              href="/tratamentos"
              className="inline-flex items-center gap-2 text-[12px] uppercase tracking-widest2 text-cocoa underline-editorial"
            >
              Ver todos os tratamentos <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {destaques.map((t, i) => (
            <Reveal key={t.slug} delay={(i % 3) * 0.1}>
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
                    {t.grupo} · {t.categoria}
                  </div>
                  <h3 className="font-display text-2xl text-ink mb-2 leading-tight">
                    {t.nome}
                  </h3>
                  <p className="text-cocoa italic font-serif text-sm mb-3">
                    {t.subtitulo}
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
}

function Signature({ t }: { t: typeof tratamentos[number] }) {
  return (
    <section className="relative py-28 md:py-36 bg-bone overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-12 items-center">
        <div className="lg:col-span-6 relative">
          <Reveal>
            <Parallax offset={30}>
              <div className="relative aspect-[5/6] overflow-hidden rounded-3xl bg-cream">
                <Image
                  src={txImg(t.slug)}
                  alt={t.nome}
                  fill
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
            </Parallax>
          </Reveal>
        </div>
        <div className="lg:col-span-6 lg:pl-8">
          <Reveal>
            <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6 flex items-center gap-3">
              <span className="h-px w-12 bg-toffee/60" /> Procedimento de assinatura
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 className="font-display text-4xl md:text-6xl leading-[1.05] text-ink text-balance">
              {t.nome}.<br />
              <span className="italic text-cocoa">{t.subtitulo}.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-8 text-lg leading-relaxed text-ink/70 max-w-xl">
              {t.resumo}
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <ul className="mt-10 grid gap-3 max-w-xl">
              {t.diferenciais.map((d) => (
                <li key={d} className="flex items-start gap-3 text-ink/75">
                  <span className="mt-2 h-1 w-6 bg-cocoa/40 shrink-0" />
                  <span className="leading-relaxed">{d}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.6} className="mt-10 flex flex-wrap gap-3">
            <CTA source="signature" href={`/tratamentos/${t.slug}`}>
              Conhecer {t.nome}
            </CTA>
            <CTA source="signature-agendar" variant="outline">
              Agendar avaliação
            </CTA>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Dra() {
  return (
    <section className="relative py-28 md:py-40 bg-cocoa text-cream overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(60% 60% at 80% 30%, rgba(231,222,208,0.25), transparent 70%), radial-gradient(50% 50% at 20% 70%, rgba(208,188,160,0.22), transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-12 items-center relative">
        <div className="lg:col-span-5 relative">
          <Reveal>
            <Parallax offset={30}>
              <div className="relative aspect-[4/5] max-w-md">
                <div className="absolute inset-0 rounded-[24px] overflow-hidden editorial-card-dark p-2">
                  <div className="relative h-full w-full rounded-[18px] overflow-hidden">
                    <Image
                      src="/img/dra/dra-2-1440.webp"
                      alt="Dra. Anna Paula Bomtempo"
                      fill
                      sizes="(min-width: 1024px) 36vw, 80vw"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 hidden md:block rounded-2xl overflow-hidden w-44 aspect-square shadow-2xl">
                  <Image
                    src="/img/dra/dra-3-960.webp"
                    alt=""
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
              </div>
            </Parallax>
          </Reveal>
        </div>

        <div className="lg:col-span-7 lg:pl-10">
          <Reveal>
            <div className="text-[11px] uppercase tracking-widest3 text-cream/55 mb-8 flex items-center gap-3">
              <span className="h-px w-12 bg-cream/40" /> A Dra. Anna
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 className="font-display text-4xl md:text-6xl leading-[1.05] text-cream text-balance">
              Medicina, sensibilidade e{" "}
              <span className="italic">tempo</span> para cada paciente.
            </h2>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mt-8 text-lg leading-relaxed text-cream/80 max-w-2xl">
              Formada pela Universidade Federal de Uberlândia, com especialização e prática em
              dermatologia clínica, cirúrgica e estética. CRM 177.888 · RQE 85.823. A Dra. Anna
              conduz pessoalmente cada protocolo, com escuta clínica e foco em resultados naturais
              ao longo do tempo.
            </p>
          </Reveal>
          <Reveal delay={0.45} className="mt-10">
            <CTA source="bloco-dra" href="/sobre" variant="outline">
              Conhecer a Dra. Anna
            </CTA>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="relative py-20 md:py-24 border-y border-cocoa/10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.l} delay={i * 0.1}>
              <div>
                <div className="font-display text-5xl md:text-6xl text-cocoa leading-none">
                  {s.v}
                </div>
                <div className="mt-4 text-sm text-ink/65 max-w-[200px]">
                  {s.l}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Confianca() {
  const credenciais = [
    { icon: GraduationCap, label: "Formação", value: "Universidade Federal de Uberlândia" },
    { icon: Stethoscope, label: "Especialização", value: "Dermatologia clínica, cirúrgica e estética" },
    { icon: ShieldCheck, label: "Registro médico", value: "CRM 177.888 · RQE 85.823" },
    { icon: Award, label: "Sociedades", value: "Sociedade Brasileira de Dermatologia" },
  ];
  return (
    <section className="relative py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Confiança"
            title="Medicina séria, conduzida por médica registrada."
            description="Sem promessas e sem antes-e-depois: esse é o nosso compromisso ético."
          />
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {credenciais.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.08}>
              <div className="editorial-card rounded-3xl p-6 h-full">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cocoa/10 text-cocoa">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">
                  {c.label}
                </div>
                <div className="font-display text-lg text-ink leading-snug">{c.value}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.45} className="mt-10 max-w-3xl mx-auto text-center">
          <p className="text-sm text-ink/55 leading-relaxed italic">
            Em conformidade com a Resolução CFM nº 1.974/2011 e Código de Ética Médica,
            este site não publica imagens de antes e depois, depoimentos com promessa de
            resultado, nem garantias terapêuticas.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const insightsPreview = [
  { t: "Descomplicando os rótulos de skincare", c: "Skincare", img: "/img/bg/section-clay-1600.webp" },
  { t: "Vitamina C: o pilar invisível da pele radiante", c: "Skincare", img: "/img/bg/tx-cat-pele-1600.webp" },
  { t: "Liftera, Ultraformer e a era do ultrassom microfocado", c: "Tecnologia", img: "/img/bg/tx-ultraformer-mpt-1600.webp" },
];

function Insights() {
  return (
    <section className="relative py-28 md:py-32 bg-bone">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
          <Reveal>
            <SectionHeading
              eyebrow="Diário"
              title={<>Estudos, anotações<br /> e cuidados da Dra.</>}
            />
          </Reveal>
          <Reveal delay={0.2}>
            <Link
              href="/blog"
              className="text-[12px] uppercase tracking-widest2 text-cocoa underline-editorial inline-flex items-center gap-2"
            >
              Ler o diário <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {insightsPreview.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.1}>
              <Link href="/blog" className="group block">
                <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-cream mb-5">
                  <Image
                    src={p.img}
                    alt={p.t}
                    fill
                    sizes="(min-width: 768px) 32vw, 90vw"
                    className="object-cover transition-transform duration-[1500ms] ease-editorial group-hover:scale-[1.04]"
                  />
                </div>
                <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">{p.c}</div>
                <h3 className="font-display text-2xl text-ink leading-tight underline-editorial">
                  {p.t}
                </h3>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function InstagramFeed() {
  const feed = [
    "/img/dra/dra-1-960.webp",
    "/img/bg/tx-cat-pele-1200.webp",
    "/img/dra/dra-4-960.webp",
    "/img/bg/tx-volnewmer-1200.webp",
    "/img/dra/dra-5-960.webp",
    "/img/bg/section-botanical-1600.webp",
  ];
  return (
    <section className="relative py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="flex flex-col items-center text-center mb-12">
            <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-4 flex items-center gap-3">
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </div>
            <h2 className="font-display text-4xl md:text-5xl text-ink text-balance leading-tight">
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener"
                className="underline-editorial"
              >
                @annabomtempo.dermato
              </a>
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {feed.map((src, i) => (
            <Reveal key={src + i} delay={(i % 6) * 0.05}>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener"
                className="group relative block aspect-square overflow-hidden rounded-2xl bg-cream"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 16vw, 33vw"
                  className="object-cover transition-transform duration-[1500ms] ease-editorial group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-700" />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Localizacao() {
  return (
    <section className="relative py-28 md:py-36 bg-bone">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Onde encontrar"
            title="Dois endereços em São Paulo."
            description="Atendimento pelos bairros mais elegantes da cidade, com estrutura premium e equipe dedicada."
          />
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {SITE.enderecos.map((e, i) => (
            <Reveal key={e.label} delay={i * 0.15}>
              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(e.mapsQuery)}`}
                target="_blank"
                rel="noopener"
                className="group block editorial-card rounded-3xl p-8 transition-all duration-700 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 text-toffee mb-5">
                  <MapPin className="h-4 w-4" />
                  <span className="text-[11px] uppercase tracking-widest3">{e.label}</span>
                </div>
                <h3 className="font-display text-3xl text-ink mb-2">{e.rua}</h3>
                {e.complemento && <p className="text-ink/65 text-sm">{e.complemento}</p>}
                <p className="text-ink/65 text-sm mt-1">
                  {e.bairro} · {e.cidade} · {e.cep}
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-[12px] uppercase tracking-widest2 text-cocoa underline-editorial">
                  Abrir no Google Maps <ArrowRight className="h-4 w-4" />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTAFinal() {
  return (
    <section className="relative py-32 md:py-40 overflow-hidden">
      <SceneBackdrop scene="curtain" intensity={0.8} />
      <div className="mx-auto max-w-4xl px-6 text-center relative">
        <Reveal>
          <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-8 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-toffee/60" />
            Sua primeira consulta
            <span className="h-px w-12 bg-toffee/60" />
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <h2 className="font-display text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] text-ink text-balance">
            Pele saudável é uma decisão{" "}
            <span className="italic text-cocoa">contínua</span>. Vamos começar a sua?
          </h2>
        </Reveal>
        <Reveal delay={0.3} className="mt-10 flex flex-wrap justify-center gap-4">
          <CTA source="cta-final">Agendar avaliação</CTA>
          <CTA source="cta-final" href="/tratamentos" variant="outline">
            Ver tratamentos
          </CTA>
        </Reveal>
      </div>
    </section>
  );
}
