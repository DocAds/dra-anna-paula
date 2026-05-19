import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import { ExternalLink } from "lucide-react";
import { updateLead, deleteLead } from "../../actions";
import type { Lead } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const FASES = ["novo", "contatado", "agendado", "compareceu", "convertido", "perdido"] as const;
const TEMPS = ["frio", "morno", "quente"] as const;

export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = await createClient();
  const { data: lead } = await sb.from("leads").select("*").eq("id", id).single<Lead>();
  if (!lead) return notFound();

  const update = async (fd: FormData) => {
    "use server";
    await updateLead(id, fd);
  };
  const remove = async () => {
    "use server";
    await deleteLead(id);
  };

  const wa = lead.whatsapp.replace(/\D/g, "");
  const waMsg = `Olá ${lead.nome.split(" ")[0]}, falo da clínica Dra. Anna Bomtempo.`;

  return (
    <main className="p-8 md:p-12">
      <Link href="/admin/crm/leads" className="text-[11px] uppercase tracking-widest3 text-toffee underline-editorial">
        ← Leads
      </Link>
      <div className="flex items-end justify-between gap-6 mt-3 mb-8">
        <div>
          <h1 className="font-display text-4xl text-ink leading-tight">{lead.nome}</h1>
          <div className="text-sm text-ink/55 mt-2">
            Recebido em {format(new Date(lead.created_at), "dd 'de' MMM yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        </div>
        <a
          href={`https://wa.me/${wa}?text=${encodeURIComponent(waMsg)}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-5 py-3 text-[12px] uppercase tracking-widest2"
        >
          <ExternalLink className="h-4 w-4" /> Falar no WhatsApp
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="editorial-card rounded-3xl p-7 space-y-5">
          <Row k="Nome" v={lead.nome} />
          <Row k="WhatsApp" v={`${lead.whatsapp} (${lead.whatsapp_country || "BR"})`} />
          <Row k="E-mail" v={lead.email || "—"} />
          <Row k="Cidade" v={lead.cidade || "—"} />
          <Row k="Interesse" v={lead.interesse || "—"} />
          <Row k="Urgência" v={lead.urgencia || "—"} />
          <Row k="Origem (botão)" v={lead.source || "—"} />
          <Row k="Página" v={lead.page_url || "—"} />
          <Row k="País IP" v={lead.ip_country || "—"} />
          {(lead.utm_source || lead.utm_campaign) && (
            <>
              <Row k="UTM source" v={lead.utm_source || "—"} />
              <Row k="UTM medium" v={lead.utm_medium || "—"} />
              <Row k="UTM campaign" v={lead.utm_campaign || "—"} />
            </>
          )}
          {lead.gclid && <Row k="gclid" v={lead.gclid} />}
          {lead.fbclid && <Row k="fbclid" v={lead.fbclid} />}
          {lead.mensagem && (
            <div>
              <div className="text-[10px] uppercase tracking-widest3 text-ink/45 mb-2">Mensagem do lead</div>
              <p className="text-ink/80 leading-relaxed italic">"{lead.mensagem}"</p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <form action={update} className="editorial-card rounded-3xl p-6 space-y-5">
            <div>
              <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">Fase</div>
              <select
                name="fase"
                defaultValue={lead.fase}
                className="w-full bg-transparent border border-cocoa/20 rounded-full px-4 py-2 text-sm text-ink"
              >
                {FASES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">Temperatura</div>
              <select
                name="temperatura"
                defaultValue={lead.temperatura}
                className="w-full bg-transparent border border-cocoa/20 rounded-full px-4 py-2 text-sm text-ink"
              >
                {TEMPS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">Cidade</div>
              <input
                name="cidade"
                defaultValue={lead.cidade || ""}
                className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-2 text-ink text-sm"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">Notas internas</div>
              <textarea
                name="notas"
                rows={6}
                defaultValue={lead.notas || ""}
                placeholder="Anotações sobre contato, observações clínicas, status..."
                className="w-full bg-transparent border border-cocoa/15 rounded-2xl p-3 text-ink text-sm resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-cocoa text-bone py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors"
            >
              Salvar
            </button>
          </form>
          <form action={remove}>
            <button
              type="submit"
              onClick={(e) => { if (!confirm("Excluir este lead?")) e.preventDefault(); }}
              className="w-full text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-red-700 transition-colors py-3"
            >
              Excluir lead
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
      <dt className="text-[10px] uppercase tracking-widest3 text-ink/45">{k}</dt>
      <dd className="text-ink text-sm break-words">{v}</dd>
    </div>
  );
}
