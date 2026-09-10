/**
 * Reclassifica a coluna `canal` de todos os leads com a MESMA função que o
 * insert usa (src/lib/leadOrigem.ts).
 *
 * Por que não é um UPDATE em SQL: a regra viveria em dois lugares, e foi
 * exatamente isso que produziu a divergência anterior, quando o SQL mandava
 * "digital" para "outro" e o TypeScript mandava para Meta Ads. Aqui existe uma
 * fonte só, e o histórico passa a concordar com o lead novo por construção.
 *
 * Uso:
 *   SUPABASE_PAT=$(security find-generic-password -s SUPABASE_PAT_ANNA -w) \
 *     node --import ./scripts/registra-alias.mjs scripts/reclassifica-canal.ts [--aplicar]
 *
 * Sem --aplicar, só mostra o que mudaria.
 */

import { classificaCanal } from "@/lib/leadOrigem";

const PROJETO = "qhadzqreqfjdjujwysfo";
const PAT = process.env.SUPABASE_PAT;
const APLICAR = process.argv.includes("--aplicar");

if (!PAT) {
  console.error("Falta SUPABASE_PAT no ambiente. Leia do keychain, não cole o valor.");
  process.exit(1);
}

async function sql<T>(query: string): Promise<T> {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJETO}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const corpo = await r.json();
  if (!r.ok) throw new Error(`Supabase recusou: ${JSON.stringify(corpo).slice(0, 300)}`);
  return corpo as T;
}

type LeadOrigem = {
  id: string;
  canal: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  gclid: string | null;
  fbclid: string | null;
  referrer: string | null;
  landing_path: string | null;
};

const leads = await sql<LeadOrigem[]>(
  "select id, canal, source, utm_source, utm_medium, gclid, fbclid, referrer, landing_path from public.leads order by created_at"
);

const mudancas = leads
  .map((l) => ({ id: l.id, de: l.canal, para: classificaCanal(l) }))
  .filter((m) => m.de !== m.para);

const resumo = new Map<string, number>();
for (const m of mudancas) {
  const k = `${m.de ?? "(vazio)"} -> ${m.para}`;
  resumo.set(k, (resumo.get(k) ?? 0) + 1);
}

console.log(`${leads.length} leads lidos, ${mudancas.length} mudariam de canal:`);
for (const [k, n] of [...resumo.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n.toString().padStart(3)}  ${k}`);
}

if (!mudancas.length) {
  console.log("Nada a fazer.");
  process.exit(0);
}

if (!APLICAR) {
  console.log("\nSimulação. Rode de novo com --aplicar para gravar.");
  process.exit(0);
}

// Os ids vêm do próprio banco e são uuid, mas a montagem do SQL é por
// concatenação: se um dia a origem mudar, a conferência abaixo é o que impede a
// injeção de voltar em silêncio.
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
for (const m of mudancas) {
  if (!FORMATO_UUID.test(m.id)) throw new Error(`id fora do formato esperado: ${m.id}`);
}

// Um UPDATE só, com a lista de ids por canal: 77 requisições seriam 77 chances
// de parar no meio.
const porCanal = new Map<string, string[]>();
for (const m of mudancas) {
  porCanal.set(m.para, [...(porCanal.get(m.para) ?? []), m.id]);
}

const casos = [...porCanal.entries()]
  .map(([canal, ids]) => `when id in (${ids.map((i) => `'${i}'`).join(",")}) then '${canal}'`)
  .join("\n    ");

await sql(`update public.leads set canal = case\n    ${casos}\n    else canal end`);
console.log(`\n${mudancas.length} leads reclassificados.`);
