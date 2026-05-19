"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { Lead } from "@/lib/supabase/types";

const COLORS = ["#82614A", "#9F825B", "#DAC09B", "#D0BCA0", "#E7DED0", "#2B1F17"];

type LeadLite = Pick<Lead, "id" | "created_at" | "source" | "interesse" | "urgencia" | "temperatura" | "fase">;

export function CrmCharts({ leads }: { leads: LeadLite[] }) {
  // Últimos 14 dias
  const dias: { d: string; n: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() - i);
    const next = new Date(dt);
    next.setDate(next.getDate() + 1);
    const n = leads.filter(
      (l) => new Date(l.created_at) >= dt && new Date(l.created_at) < next
    ).length;
    dias.push({
      d: dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      n,
    });
  }

  // Temperatura
  const tempCount = ["frio", "morno", "quente"].map((t) => ({
    name: t,
    value: leads.filter((l) => l.temperatura === t).length,
  }));

  // Fase
  const fases = ["novo", "contatado", "agendado", "compareceu", "convertido", "perdido"];
  const faseCount = fases.map((f) => ({
    name: f,
    value: leads.filter((l) => l.fase === f).length,
  }));

  // Top sources
  const sources = new Map<string, number>();
  leads.forEach((l) => {
    const s = l.source || "desconhecido";
    sources.set(s, (sources.get(s) || 0) + 1);
  });
  const topSources = Array.from(sources.entries())
    .map(([k, v]) => ({ name: k, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="editorial-card rounded-3xl p-6">
        <h3 className="font-display text-lg text-ink mb-4">Leads nos últimos 14 dias</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dias}>
            <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#9F825B" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9F825B" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#FBF7F1", border: "1px solid #82614A22", borderRadius: 12 }} />
            <Bar dataKey="n" fill="#82614A" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="editorial-card rounded-3xl p-6">
        <h3 className="font-display text-lg text-ink mb-4">Temperatura</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={tempCount} dataKey="value" nameKey="name" outerRadius={80} innerRadius={50}>
              {tempCount.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip contentStyle={{ background: "#FBF7F1", border: "1px solid #82614A22", borderRadius: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="editorial-card rounded-3xl p-6">
        <h3 className="font-display text-lg text-ink mb-4">Fase do atendimento</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={faseCount} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: "#9F825B" }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#9F825B" }} axisLine={false} tickLine={false} width={90} />
            <Tooltip contentStyle={{ background: "#FBF7F1", border: "1px solid #82614A22", borderRadius: 12 }} />
            <Bar dataKey="value" fill="#9F825B" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="editorial-card rounded-3xl p-6">
        <h3 className="font-display text-lg text-ink mb-4">Origem dos leads</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topSources} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10, fill: "#9F825B" }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#9F825B" }} axisLine={false} tickLine={false} width={130} />
            <Tooltip contentStyle={{ background: "#FBF7F1", border: "1px solid #82614A22", borderRadius: 12 }} />
            <Bar dataKey="value" fill="#DAC09B" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
