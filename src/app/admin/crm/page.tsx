import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TrendingUp, Users, Thermometer, Target, AlertCircle } from "lucide-react";
import { CrmCharts } from "./CrmCharts";
import type { LeadLite } from "./CrmCharts";
import { requireSection } from "@/lib/admin-guard";
import { diaSP, inicioDoDiaSP } from "@/lib/dataSP";

export const dynamic = "force-dynamic";

export default async function CrmDashboard() {
  await requireSection("dashboard");
  const sb = await createClient();
  const { data: leads = [], error: erroLeads } = await sb
    .from("leads")
    .select(
      "id, created_at, source, canal, utm_source, utm_medium, utm_campaign, gclid, fbclid, referrer, interesse, urgencia, temperatura, fase"
    )
    .order("created_at", { ascending: false })
    .returns<LeadLite[]>();

  // Zero é um resultado válido, e por isso mente melhor do que uma tela em
  // branco: sem este aviso, uma falha de leitura vira "nenhum lead" e a clínica
  // acha que o site parou de captar.
  if (erroLeads) {
    console.error("[crm] falha ao carregar leads", {
      code: erroLeads.code,
      message: erroLeads.message,
    });
    return (
      <main className="p-8 md:p-12">
        <div className="text-[11px] uppercase tracking-widest3 text-cocoa mb-3">CRM</div>
        <h1 className="font-display text-4xl text-ink leading-tight mb-6">Dashboard</h1>
        <div role="alert" className="editorial-card rounded-3xl p-8 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-700 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-display text-xl text-ink">Não deu para carregar os números.</p>
            <p className="text-sm text-ink/70 mt-1">
              {erroLeads.code === "42703" || erroLeads.code === "PGRST204"
                ? "O banco ainda não tem as colunas de origem: falta aplicar a migration 008_leads_origem.sql."
                : `A base respondeu com um erro (${erroLeads.code ?? "sem código"}). O registro completo está no log do servidor.`}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const total = leads?.length || 0;
  const inicioDeHoje = inicioDoDiaSP(diaSP());
  const todayCount = (leads || []).filter((l) => new Date(l.created_at) >= inicioDeHoje).length;
  const last7 = new Date();
  last7.setDate(last7.getDate() - 6);
  const week = (leads || []).filter((l) => new Date(l.created_at) >= last7);
  const convertidos = (leads || []).filter((l) => l.fase === "convertido").length;
  const conv = total > 0 ? Math.round((convertidos / total) * 100) : 0;

  const kpis = [
    { v: total, l: "Leads no total", icon: Users },
    { v: todayCount, l: "Novos hoje", icon: TrendingUp },
    { v: (leads || []).filter((l) => l.temperatura === "quente").length, l: "Quentes", icon: Thermometer },
    { v: `${conv}%`, l: "Conversão", icon: Target },
  ];

  return (
    <main className="p-8 md:p-12">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-3">CRM</div>
          <h1 className="font-display text-4xl text-ink leading-tight">Painel de leads</h1>
        </div>
        <Link
          href="/admin/crm/leads"
          className="text-[12px] uppercase tracking-widest2 text-cocoa underline-editorial"
        >
          Ver todos os leads →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {kpis.map((k) => (
          <div key={k.l} className="editorial-card rounded-3xl p-6">
            <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cocoa/10 text-cocoa">
              <k.icon className="h-4 w-4" />
            </div>
            <div className="font-display text-4xl text-ink leading-none">{k.v}</div>
            <div className="text-[11px] uppercase tracking-widest2 text-ink/55 mt-3">{k.l}</div>
          </div>
        ))}
      </div>

      <CrmCharts leads={leads || []} />
    </main>
  );
}
