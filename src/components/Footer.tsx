import Link from "next/link";
import { LogoAB } from "./LogoAB";
import { SITE, NAV, whatsappLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative bg-cocoa text-cream">
      <div className="absolute inset-x-0 top-0 h-px shimmer-line animate-shimmer" />
      <div className="mx-auto max-w-6xl px-6 py-20 grid gap-14 md:grid-cols-12">
        <div className="md:col-span-5 space-y-6">
          <LogoAB tone="light" variant="full" className="h-14 w-auto" />
          <p className="text-cream/80 max-w-md text-balance leading-relaxed">
            Dermatologia premium em São Paulo. Tratamentos personalizados, tecnologia
            de ponta e acompanhamento próximo para cada etapa da sua pele.
          </p>
          <div className="text-xs uppercase tracking-widest2 text-cream/55">
            {SITE.crm} · {SITE.rqe}
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="text-[11px] uppercase tracking-widest3 text-cream/55">Navegação</div>
          <ul className="space-y-2 text-sm">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="underline-editorial">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4 space-y-6">
          <div>
            <div className="text-[11px] uppercase tracking-widest3 text-cream/55 mb-3">Atendimento</div>
            <a href={whatsappLink()} target="_blank" rel="noopener" className="block font-display text-2xl">
              {SITE.phone}
            </a>
            <a href={SITE.instagram} target="_blank" rel="noopener" className="underline-editorial text-sm">
              @annabomtempo.dermato
            </a>
          </div>
          <div className="space-y-3 text-sm text-cream/75">
            {SITE.enderecos.map((e) => (
              <div key={e.label}>
                <div className="text-[11px] uppercase tracking-widest3 text-cream/55 mb-1">{e.label}</div>
                <div>{e.rua}{e.complemento ? `, ${e.complemento}` : ""}</div>
                <div>{e.bairro} · {e.cidade}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-cream/15">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] uppercase tracking-widest2 text-cream/55">
          <span>© {new Date().getFullYear()} Anna Bomtempo Dermatologia</span>
          <span className="flex items-center gap-5">
            <Link
              href="/admin"
              aria-label="Área restrita"
              className="text-cream/35 hover:text-cream/75 transition-colors text-[10px] tracking-widest3"
            >
              Equipe
            </Link>
            <span>
              Site por <a href="https://docads.com.br" className="underline-editorial">DocAds</a>
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
