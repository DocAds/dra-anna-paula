import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import { ExternalLink, MessageCircle, Mail, MapPin, Sparkles, Clock, Globe, Smartphone, Megaphone } from "lucide-react";
import { updateLead, deleteLead } from "../../actions";
import { LeadActions } from "./LeadActions";
import type { Lead } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function traduzCanalUtm(u: Pick<Lead, "utm_source" | "utm_medium" | "utm_campaign" | "gclid" | "fbclid">) {
  if (u.gclid) return "Veio de um anúncio do Google";
  if (u.fbclid) return "Veio de um anúncio do Facebook ou Instagram";
  if (u.utm_source) {
    const src = u.utm_source.toLowerCase();
    if (src.includes("google")) return "Veio de uma campanha do Google";
    if (src.includes("face") || src.includes("meta") || src.includes("instagram")) return "Veio de uma campanha do Meta (Facebook/Instagram)";
    if (src.includes("tiktok")) return "Veio do TikTok";
    if (src.includes("whatsapp")) return "Veio de link do WhatsApp";
    if (src.includes("organic") || src.includes("google_organic")) return "Veio do Google sem ser anúncio";
    return `Veio de ${u.utm_source}`;
  }
  return "Veio direto do site (sem campanha rastreada)";
}

function traduzSource(s: string | null) {
  const map: Record<string, string> = {
    hero: "Botão principal do topo (Hero)",
    "nav": "Botão 'Agendar' no cabeçalho",
    float: "Botão flutuante do WhatsApp",
    "cta-final": "CTA do final da página",
    "bloco-dra": "Bloco da Dra. Anna",
    "tratamentos-final": "Final da página de tratamentos",
    signature: "Bloco do tratamento de destaque (Ultraformer)",
    "signature-agendar": "Tratamento de destaque (botão Agendar)",
    "sobre-hero": "Página Sobre — topo",
    "sobre-final": "Página Sobre — final",
    "contato-final": "Página de contato — botão final",
    "resultados-final": "Final da galeria",
    modal: "Pop-up de qualificação",
  };
  if (!s) return "—";
  if (map[s]) return map[s];
  if (s.startsWith("tratamento-")) {
    const slug = s.replace(/^tratamento-/, "").replace(/-final$|-saiba$/g, "");
    return `Página de tratamento: ${slug}`;
  }
  if (s.startsWith("whatsapp:")) return `Clique direto no WhatsApp (${s.replace("whatsapp:", "")})`;
  if (s.startsWith("form:")) return `Formulário de contato (${s.replace("form:", "")})`;
  return s;
}

export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createClient();
  const { data: lead } = await sb.from("leads").select("*").eq("id", id).maybeSingle<Lead>();
  if (!lead) return notFound();

  const update = async (fd: FormData) => {
    "use server";
    await updateLead(id, fd);
  };
  const remove = async () => {
    "use server";
    await deleteLead(id);
  };

  const wa = (lead.whatsapp || "").replace(/\D/g, "");
  const waMsg = `Olá ${lead.nome.split(" ")[0]}, falo da clínica Dra. Anna Bomtempo. Tudo bem? Você deixou contato pelo nosso site.`;
  const canal = traduzCanalUtm(lead);

  return (
    <main className="p-8 md:p-12">
      <Link href="/admin/crm/leads" className="text-[11px] uppercase tracking-widest3 text-toffee underline-editorial">
        ← Leads
      </Link>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mt-3 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="font-display text-4xl text-ink leading-tight">{lead.nome}</h1>
            <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${
              lead.temperatura === "quente" ? "bg-cocoa text-bone"
              : lead.temperatura === "morno" ? "bg-biscotti/30 text-toffee"
              : "bg-latte/30 text-cocoa"
            }`}>
              {lead.temperatura}
            </span>
          </div>
          <div className="text-sm text-ink/55">
            Recebido em {format(new Date(lead.created_at), "dd 'de' MMM yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        </div>
        {wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(waMsg)}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-5 py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Falar no WhatsApp
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="editorial-card rounded-3xl p-7">
            <h2 className="text-[10px] uppercase tracking-widest3 text-toffee mb-5">Contato</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <Block icon={MessageCircle} label="WhatsApp" value={`${lead.whatsapp || "—"}`} sub={lead.whatsapp_country ? `País: ${lead.whatsapp_country}` : undefined} />
              <Block icon={Mail} label="E-mail" value={lead.email || "Não informado"} />
              <Block icon={MapPin} label="Cidade" value={lead.cidade || "Não informada"} />
              <Block icon={Globe} label="País detectado pelo IP" value={lead.ip_country || "Não identificado"} />
            </div>
          </section>

          <section className="editorial-card rounded-3xl p-7">
            <h2 className="text-[10px] uppercase tracking-widest3 text-toffee mb-5">Interesse</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <Block icon={Sparkles} label="Procurando por" value={lead.interesse || "Não informado"} />
              <Block icon={Clock} label="Urgência" value={lead.urgencia || "Não informada"} />
            </div>
            {lead.mensagem && (
              <div className="mt-6 pt-5 border-t border-cocoa/10">
                <div className="text-[10px] uppercase tracking-widest3 text-ink/45 mb-2">Mensagem escrita pelo lead</div>
                <p className="text-ink/85 leading-relaxed italic">&ldquo;{lead.mensagem}&rdquo;</p>
              </div>
            )}
          </section>

          <section className="editorial-card rounded-3xl p-7">
            <h2 className="text-[10px] uppercase tracking-widest3 text-toffee mb-5">Origem do lead</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <Block icon={Megaphone} label="Como chegou até nós" value={canal} />
              <Block icon={Smartphone} label="Botão que clicou" value={traduzSource(lead.source)} />
              {lead.page_url && (
                <Block icon={Globe} label="Página de origem" value={prettyUrl(lead.page_url)} />
              )}
              {lead.utm_campaign && (
                <Block icon={Megaphone} label="Nome da campanha" value={lead.utm_campaign} />
              )}
              {lead.utm_medium && (
                <Block icon={Megaphone} label="Tipo de anúncio" value={lead.utm_medium} />
              )}
              {lead.utm_content && (
                <Block icon={Megaphone} label="Criativo / variação" value={lead.utm_content} />
              )}
              {lead.utm_term && (
                <Block icon={Megaphone} label="Palavra-chave" value={lead.utm_term} />
              )}
            </div>
          </section>

          <section className="editorial-card rounded-3xl p-7">
            <h2 className="text-[10px] uppercase tracking-widest3 text-toffee mb-5">Como o sistema classifica</h2>
            <ul className="space-y-3 text-sm text-ink/75 leading-relaxed">
              <li><strong className="text-cocoa">Quente</strong> — lead disse que tem urgência "hoje" ou "esta semana"</li>
              <li><strong className="text-cocoa">Morno</strong> — lead pretende fazer "este mês"</li>
              <li><strong className="text-cocoa">Frio</strong> — lead respondeu "sem pressa"</li>
            </ul>
            <p className="text-xs text-ink/45 mt-4">
              A temperatura é definida automaticamente pela urgência informada no pop-up.
              Você pode mudar manualmente no painel à direita.
            </p>
          </section>
        </div>

        <LeadActions lead={lead} onSave={update} onDelete={remove} />
      </div>
    </main>
  );
}

function prettyUrl(u: string) {
  try {
    const url = new URL(u);
    return url.pathname || "/";
  } catch {
    return u;
  }
}

function Block({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-cocoa/10 text-cocoa shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest3 text-ink/45">{label}</div>
        <div className="text-ink text-sm leading-snug break-words mt-1">{value}</div>
        {sub && <div className="text-[11px] text-ink/45 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
