import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExternalLink, MessageCircle, Mail, MapPin, Sparkles, Clock, Globe, Smartphone, Megaphone } from "lucide-react";
import { updateLead, deleteLead } from "../../actions";
import { createNote, updateNote, deleteNote } from "../../notes-actions";
import { LeadActions } from "./LeadActions";
import { LeadNotes } from "./LeadNotes";
import type { Lead } from "@/lib/supabase/types";
import { TEMP_BADGE, TEMP_LABEL } from "@/lib/crmStatus";
import { traduzCanalUtm, traduzSource, CANAL_LABEL, canalDoLead } from "@/lib/leadOrigem";
import { linkWhatsapp, mascaraTelefone } from "@/lib/leadWhatsapp";
import { formataCompletoSP } from "@/lib/dataSP";
import { requireSection } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSection("leads");
  const { id } = await params;
  const sb = await createClient();
  const { data: lead } = await sb.from("leads").select("*").eq("id", id).maybeSingle<Lead>();
  if (!lead) return notFound();

  const { data: { user } } = await sb.auth.getUser();
  const { data: notes = [] } = await sb
    .from("lead_notes")
    .select("id, content, created_at, updated_at, author:profiles(name,email)")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  const update = async (fd: FormData) => {
    "use server";
    await updateLead(id, fd);
  };
  const remove = async () => {
    "use server";
    await deleteLead(id);
  };

  const waHref = linkWhatsapp(lead);
  const canal = traduzCanalUtm(lead);

  return (
    <main className="p-8 md:p-12">
      <Link href="/admin/crm/leads" className="text-[11px] uppercase tracking-widest3 text-cocoa underline-editorial">
        ← Leads
      </Link>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mt-3 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="font-display text-4xl text-ink leading-tight">{lead.nome}</h1>
            <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${TEMP_BADGE[lead.temperatura]}`}>
              {TEMP_LABEL[lead.temperatura]}
            </span>
          </div>
          <div className="text-sm text-ink/70">
            Recebido em {formataCompletoSP(lead.created_at)}
          </div>
        </div>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-5 py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> Falar no WhatsApp
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="editorial-card rounded-3xl p-7">
            <h2 className="text-[10px] uppercase tracking-widest3 text-cocoa mb-5">Contato</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <Block icon={MessageCircle} label="WhatsApp" value={mascaraTelefone(lead.whatsapp, lead.whatsapp_country) || "—"} sub={lead.whatsapp_country && lead.whatsapp_country !== "BR" ? `País: ${lead.whatsapp_country}` : undefined} />
              <Block icon={Mail} label="E-mail" value={lead.email || "Não informado"} />
              <Block icon={MapPin} label="Cidade" value={lead.cidade || "Não informada"} />
              <Block icon={Globe} label="País detectado pelo IP" value={lead.ip_country || "Não identificado"} />
            </div>
          </section>

          <section className="editorial-card rounded-3xl p-7">
            <h2 className="text-[10px] uppercase tracking-widest3 text-cocoa mb-5">Interesse</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <Block icon={Sparkles} label="Procurando por" value={lead.interesse || "Não informado"} />
              <Block icon={Clock} label="Urgência" value={lead.urgencia || "Não informada"} />
            </div>
            {lead.mensagem && (
              <div className="mt-6 pt-5 border-t border-cocoa/10">
                <div className="text-[10px] uppercase tracking-widest3 text-ink/70 mb-2">Mensagem escrita pelo lead</div>
                <p className="text-ink/85 leading-relaxed italic">&ldquo;{lead.mensagem}&rdquo;</p>
              </div>
            )}
          </section>

          <section className="editorial-card rounded-3xl p-7">
            <h2 className="text-[10px] uppercase tracking-widest3 text-cocoa mb-5">Origem do lead</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <Block icon={Megaphone} label="Como chegou até nós" value={canal} sub={`Canal: ${CANAL_LABEL[canalDoLead(lead)]}`} />
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
              {lead.landing_path && (
                <Block icon={Globe} label="Por onde entrou no site" value={lead.landing_path} />
              )}
              {lead.referrer && (
                <Block icon={Globe} label="Site que trouxe" value={prettyUrl(lead.referrer)} />
              )}
            </div>
          </section>

          <LeadNotes
            leadId={id}
            initial={(notes || []).map((n) => ({
              ...n,
              author: Array.isArray(n.author) ? n.author[0] : n.author,
            })) as Parameters<typeof LeadNotes>[0]["initial"]}
            onCreate={createNote}
            onUpdate={updateNote}
            onDelete={deleteNote}
            currentUserEmail={user?.email}
          />

          <section className="editorial-card rounded-3xl p-7">
            <h2 className="text-[10px] uppercase tracking-widest3 text-cocoa mb-5">Como o sistema classifica</h2>
            <ul className="space-y-3 text-sm text-ink/75 leading-relaxed">
              <li><strong className="text-cocoa">Quente</strong> — lead disse que tem urgência "hoje" ou "esta semana"</li>
              <li><strong className="text-cocoa">Morno</strong> — lead pretende fazer "este mês"</li>
              <li><strong className="text-cocoa">Frio</strong> — lead respondeu "sem pressa"</li>
            </ul>
            <p className="text-xs text-ink/70 mt-4">
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
        <div className="text-[10px] uppercase tracking-widest3 text-ink/70">{label}</div>
        <div className="text-ink text-sm leading-snug break-words mt-1">{value}</div>
        {sub && <div className="text-[11px] text-ink/70 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
