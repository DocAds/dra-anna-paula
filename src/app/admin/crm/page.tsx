import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TrendingUp, Users, Thermometer, Target } from "lucide-react";
import { CrmCharts } from "./CrmCharts";
import type { Lead } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function CrmDashboard() {
  const sb = await createClient();
  const { data: leads = [] } = await sb
    .from("leads")
    .select("id, created_at, source, interesse, urgencia, temperatura, fase")
    .order("created_at", { ascending: false })
    .returns<Pick<Lead, "id" | "created_at" | "source" | "interesse" | "urgencia" | "temperatura" | "fase">[]>();

  const total = leads?.length || 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = (leads || []).filter((l) => new Date(l.created_at) >= today).length;
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
      <div className="flex items-end justify-between gap-6 mb-10">
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
