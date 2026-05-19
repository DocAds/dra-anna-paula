import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import type { Lead } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const FASES = ["novo", "contatado", "agendado", "compareceu", "convertido", "perdido"] as const;

const FASE_COLOR: Record<string, string> = {
  novo: "bg-toffee/15 text-toffee",
  contatado: "bg-cocoa/15 text-cocoa",
  agendado: "bg-biscotti/20 text-toffee",
  compareceu: "bg-latte/30 text-cocoa",
  convertido: "bg-cocoa text-bone",
  perdido: "bg-ink/10 text-ink/55",
};

const TEMP_COLOR: Record<string, string> = {
  frio: "bg-latte/30 text-cocoa",
  morno: "bg-biscotti/30 text-toffee",
  quente: "bg-cocoa text-bone",
};

export default async function LeadsList({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const sb = await createClient();
  let q = sb.from("leads").select("*").order("created_at", { ascending: false });
  if (sp.fase && FASES.includes(sp.fase as (typeof FASES)[number])) {
    q = q.eq("fase", sp.fase);
  }
  if (sp.q) {
    q = q.or(`nome.ilike.%${sp.q}%,whatsapp.ilike.%${sp.q}%,email.ilike.%${sp.q}%`);
  }
  const { data: leads } = await q.returns<Lead[]>();

  return (
    <main className="p-8 md:p-12">
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-3">CRM</div>
          <h1 className="font-display text-4xl text-ink leading-tight">Leads</h1>
        </div>
        <Link
          href="/admin/crm"
          className="text-[12px] uppercase tracking-widest2 text-cocoa underline-editorial"
        >
          ← Painel
        </Link>
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={sp.q || ""}
          placeholder="Buscar nome, telefone ou e-mail"
          className="flex-1 min-w-[200px] bg-transparent border border-cocoa/15 rounded-full px-5 py-2.5 text-sm text-ink focus:border-cocoa outline-none"
        />
        <select
          name="fase"
          defaultValue={sp.fase || ""}
          className="bg-transparent border border-cocoa/15 rounded-full px-4 py-2.5 text-sm text-ink"
        >
          <option value="">Todas as fases</option>
          {FASES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <button className="rounded-full bg-cocoa text-bone px-5 py-2.5 text-[11px] uppercase tracking-widest2">
          Filtrar
        </button>
      </form>

      {!leads?.length ? (
        <div className="editorial-card rounded-3xl p-10 text-center text-ink/55">
          Nenhum lead {sp.fase ? `na fase ${sp.fase}` : "ainda"}.
        </div>
      ) : (
        <ul className="grid gap-3">
          {leads.map((l) => (
            <li key={l.id}>
              <Link
                href={`/admin/crm/leads/${l.id}`}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 editorial-card rounded-3xl px-6 py-5 hover:-translate-y-0.5 transition-all duration-500"
              >
                <div className="min-w-0">
                  <div className="font-display text-lg text-ink truncate">{l.nome}</div>
                  <div className="text-[11px] uppercase tracking-widest2 text-ink/45 mt-1 flex flex-wrap gap-3">
                    <span>{l.whatsapp}</span>
                    {l.interesse && <span>· {l.interesse}</span>}
                    {l.source && <span>· {l.source}</span>}
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${TEMP_COLOR[l.temperatura]}`}>
                  {l.temperatura}
                </span>
                <span className={`text-[10px] uppercase tracking-widest2 px-3 py-1 rounded-full ${FASE_COLOR[l.fase]}`}>
                  {l.fase}
                </span>
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-ink/55">
                  <span>{format(new Date(l.created_at), "dd MMM HH:mm", { locale: ptBR })}</span>
                  <ArrowRight className="h-4 w-4 text-cocoa" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
