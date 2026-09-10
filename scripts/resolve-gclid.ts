/**
 * Descobre campanha, grupo, anúncio e palavra-chave de cada lead que veio do
 * Google, consultando o relatório `click_view` pelo gclid.
 *
 * Por que existe: o gclid é opaco para o anunciante. Sem sufixo de URL na conta,
 * o lead chega ao CRM sabendo só que veio do Google Ads, e não de qual campanha
 * nem por qual palavra. O click_view devolve tudo isso, e é o ÚNICO caminho que
 * recupera o histórico, porque o sufixo de URL só vale para clique novo.
 *
 * Duas restrições mandam no desenho:
 * - `segments.date` aceita UM dia por consulta, então é uma consulta por dia.
 * - O click_view guarda 90 DIAS. O que passar disso não volta nunca; rodar cedo.
 *
 * Uso:
 *   SUPABASE_PAT=$(security find-generic-password -s SUPABASE_PAT_ANNA -w) \
 *     node --import ./scripts/registra-alias.mjs scripts/resolve-gclid.ts [--aplicar]
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API = "v25";
const CONTA = "1556989178";
const LOGIN = "8294979564";
const PROJETO = "qhadzqreqfjdjujwysfo";
const PAT = process.env.SUPABASE_PAT;
const APLICAR = process.argv.includes("--aplicar");

if (!PAT) {
  console.error("Falta SUPABASE_PAT no ambiente. Leia do keychain, não cole o valor.");
  process.exit(1);
}

// Mesmo caminho que o tooling do ads-workflow usa: a credencial já está
// configurada para o MCP, não há segredo novo em lugar nenhum.
function credenciais() {
  const cfg = JSON.parse(readFileSync(join(homedir(), ".claude.json"), "utf8"));
  const env = cfg.mcpServers?.["google-ads"]?.env;
  if (!env) throw new Error("MCP google-ads não configurado em ~/.claude.json");
  const oauth = JSON.parse(readFileSync(env.GOOGLE_ADS_CREDENTIALS_PATH, "utf8"));
  return { dev: env.GOOGLE_ADS_DEVELOPER_TOKEN as string, oauth };
}

async function accessToken(oauth: Record<string, string>) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauth.client_id,
      client_secret: oauth.client_secret,
      refresh_token: oauth.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error(`OAuth falhou: HTTP ${r.status}`);
  return (await r.json()).access_token as string;
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

type Lead = { id: string; gclid: string; dia: string };
type Clique = {
  campanha_id: string;
  campanha: string;
  grupo_id: string;
  grupo: string;
  anuncio_id: string;
  palavra?: string;
  correspondencia?: string;
};

const leads = await sql<Lead[]>(`
  select id, gclid, to_char(created_at at time zone 'America/Sao_Paulo','YYYY-MM-DD') as dia
  from public.leads
  -- Resolve todo lead com gclid que ainda não passou pelo click_view. Ter
  -- campaign_id não basta: o gad_campaignid da URL dá só o número da campanha,
  -- e o que falta saber é o grupo, o anúncio e a palavra buscada.
  where gclid is not null and gclid <> ''
    and coalesce(origem_extra->>'fonte', '') <> 'click_view'
  order by created_at`);

if (!leads.length) {
  console.log("Nenhum lead do Google pendente de resolução.");
  process.exit(0);
}

const dias = [...new Set(leads.map((l) => l.dia))].sort();
console.log(`${leads.length} leads com gclid, em ${dias.length} dias.`);

const { dev, oauth } = credenciais();
const token = await accessToken(oauth);

const porGclid = new Map<string, Clique>();

for (const dia of dias) {
  const r = await fetch(`https://googleads.googleapis.com/${API}/customers/${CONTA}/googleAds:search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": dev,
      "login-customer-id": LOGIN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `SELECT click_view.gclid, campaign.id, campaign.name, ad_group.id, ad_group.name,
              click_view.keyword_info.text, click_view.keyword_info.match_type, click_view.ad_group_ad
              FROM click_view WHERE segments.date = '${dia}'`,
    }),
  });

  if (!r.ok) {
    // Dia fora da janela de 90 dias devolve erro em vez de lista vazia; seguir
    // em frente é melhor que abortar os outros dias.
    console.warn(`  ${dia}: API recusou (HTTP ${r.status}), pulando`);
    continue;
  }

  const dados = (await r.json()) as { results?: Record<string, never>[] };
  for (const linha of dados.results ?? []) {
    const cv = (linha as Record<string, Record<string, string>>).clickView;
    const camp = (linha as Record<string, Record<string, string>>).campaign;
    const grupo = (linha as Record<string, Record<string, string>>).adGroup;
    const kw = (cv as unknown as { keywordInfo?: { text?: string; matchType?: string } }).keywordInfo;
    if (!cv?.gclid) continue;
    porGclid.set(cv.gclid, {
      campanha_id: camp?.id,
      campanha: camp?.name,
      grupo_id: grupo?.id,
      grupo: grupo?.name,
      anuncio_id: String(cv.adGroupAd ?? "").split("~")[1] ?? "",
      palavra: kw?.text,
      correspondencia: kw?.matchType,
    });
  }
  console.log(`  ${dia}: ${dados.results?.length ?? 0} cliques no relatório`);
}

const resolvidos = leads
  .map((l) => ({ lead: l, clique: porGclid.get(l.gclid) }))
  .filter((x): x is { lead: Lead; clique: Clique } => !!x.clique);

console.log(`\n${resolvidos.length} de ${leads.length} leads resolvidos:`);
for (const { lead, clique } of resolvidos) {
  console.log(`  ${lead.dia}  ${clique.grupo} · ${clique.palavra ?? "(sem palavra)"} (${clique.correspondencia ?? "-"})`);
}

if (!resolvidos.length || !APLICAR) {
  if (resolvidos.length) console.log("\nSimulação. Rode de novo com --aplicar para gravar.");
  process.exit(0);
}

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const escapa = (v: string | undefined) => (v ? `'${String(v).replace(/'/g, "''").slice(0, 200)}'` : "null");

for (const { lead, clique } of resolvidos) {
  if (!FORMATO_UUID.test(lead.id)) throw new Error(`id fora do formato: ${lead.id}`);
  // utm_* fica intocado de propósito: ele representa o que veio na URL. O que a
  // API resolveu entra nas colunas de id e no origem_extra, com a fonte marcada,
  // para nunca se confundir com dado declarado pela campanha.
  await sql(`update public.leads set
      campaign_id = ${escapa(clique.campanha_id)},
      adset_id = ${escapa(clique.grupo_id)},
      ad_id = ${escapa(clique.anuncio_id)},
      origem_extra = coalesce(origem_extra, '{}'::jsonb) || jsonb_build_object(
        'fonte', 'click_view',
        'campanha_nome', ${escapa(clique.campanha)},
        'grupo_nome', ${escapa(clique.grupo)},
        'palavra', ${escapa(clique.palavra)},
        'correspondencia', ${escapa(clique.correspondencia)}
      )
    where id = '${lead.id}'`);
}

console.log(`\n${resolvidos.length} leads atualizados com campanha, grupo, anúncio e palavra.`);
