import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { LiquidBackdrop } from "@/components/LiquidBackdrop";
import { CTA } from "@/components/CTA";
import { SITE } from "@/lib/site";
import { openGraph } from "@/lib/seo";
import { LeadForm } from "@/components/LeadForm";
import { DiscreetMap } from "@/components/DiscreetMap";
import { MapPin, Instagram, Phone, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contato",
  description: "Agendamento e atendimento Dra. Anna Bomtempo · Vila Olímpia, São Paulo.",
  alternates: { canonical: "/contato" },
  openGraph: openGraph({
    title: "Contato · Dra. Anna Bomtempo",
    description: "Agendamento e atendimento na Vila Olímpia, São Paulo.",
    path: "/contato",
  }),
};

export default function ContatoPage() {
  return (
    <>
      <section className="relative pt-40 pb-24 overflow-hidden">
        <LiquidBackdrop variant="cream" />
        <div className="mx-auto max-w-7xl px-6 grid gap-14 lg:grid-cols-12 relative">
          <div className="lg:col-span-6 z-10">
            <Reveal>
              <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6 flex items-center gap-3">
                <span className="h-px w-12 bg-toffee/60" /> Atendimento
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="font-display text-[clamp(2.4rem,7vw,5rem)] leading-[0.98] text-ink text-balance">
                Vamos começar pela sua primeira <span className="italic text-cocoa">consulta</span>.
              </h1>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-6 text-lg leading-relaxed text-ink/70 max-w-xl">
                Deixe seu contato que retornamos por WhatsApp para entender o seu caso e
                agendar a avaliação na unidade mais próxima.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-4">
              <Reveal delay={0.4}>
                <a
                  href={`tel:${SITE.phone.replace(/\s|\+/g, "")}`}
                  className="editorial-card rounded-3xl p-6 flex items-center gap-5 hover:-translate-y-0.5 transition-all duration-500"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cocoa/10 text-cocoa">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-1">WhatsApp</div>
                    <div className="font-display text-xl text-ink">{SITE.phone}</div>
                  </div>
                </a>
              </Reveal>
              <Reveal delay={0.5}>
                <a
                  href={SITE.instagram}
                  target="_blank"
                  rel="noopener"
                  className="editorial-card rounded-3xl p-6 flex items-center gap-5 hover:-translate-y-0.5 transition-all duration-500"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cocoa/10 text-cocoa">
                    <Instagram className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-1">Instagram</div>
                    <div className="font-display text-xl text-ink">@annabomtempo.dermato</div>
                  </div>
                </a>
              </Reveal>
              <Reveal delay={0.6}>
                <a
                  href={`mailto:${SITE.email}`}
                  className="editorial-card rounded-3xl p-6 flex items-center gap-5 hover:-translate-y-0.5 transition-all duration-500"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cocoa/10 text-cocoa">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-1">E-mail</div>
                    <div className="font-display text-xl text-ink">{SITE.email}</div>
                  </div>
                </a>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Reveal delay={0.2}>
              <div className="editorial-card rounded-3xl p-8 md:p-10">
                <LeadForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-bone">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6 flex items-center gap-3">
              <span className="h-px w-12 bg-toffee/60" /> Onde atendo
            </div>
            <h2 className="font-display text-4xl md:text-5xl leading-tight text-ink text-balance max-w-2xl">
              Onde eu te recebo.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="grid gap-6">
            {SITE.enderecos.map((e, i) => (
              <Reveal key={e.label} delay={i * 0.15}>
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(e.mapsQuery)}`}
                  target="_blank"
                  rel="noopener"
                  className="block editorial-card rounded-3xl p-8 hover:-translate-y-1 transition-all duration-700"
                >
                  <div className="flex items-center gap-3 text-toffee mb-5">
                    <MapPin className="h-4 w-4" />
                    <span className="text-[11px] uppercase tracking-widest3">{e.label}</span>
                  </div>
                  <h3 className="font-display text-3xl text-ink mb-2">{e.rua}</h3>
                  {e.complemento && <p className="text-ink/65 text-sm">{e.complemento}</p>}
                  <p className="text-ink/65 text-sm mt-1">{e.bairro} · {e.cidade} · {e.cep}</p>
                </a>
              </Reveal>
            ))}
            </div>
            <Reveal delay={0.2}>
              <DiscreetMap query={SITE.enderecos[0].mapsQuery} minHeight={360} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <CTA source="contato-final">Prefiro falar agora no WhatsApp</CTA>
          </Reveal>
        </div>
      </section>
    </>
  );
}
