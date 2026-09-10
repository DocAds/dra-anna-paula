-- ============================================================================
-- Origem do lead: canal normalizado, página de entrada, consentimento e busca
-- ============================================================================
--
-- Por que o canal vira coluna em vez de ser calculado na leitura: o painel
-- precisa FILTRAR por origem, e classificar na leitura obrigaria a carregar
-- todos os leads para depois descartar. Com a coluna, o filtro é um índice.
--
-- A cascata aqui embaixo é a mesma de src/lib/leadOrigem.ts (classificaCanal) e
-- a mesma que o insert aplica em src/app/api/lead/route.ts. Mudou uma, mudam as
-- três, senão o histórico e o lead novo passam a discordar.

-- Fixa o search_path da transação: o operator class do trigram
-- (gin_trgm_ops) vive no schema da extensão, e uma conexão com search_path
-- resetado (pooler, CI, role customizado) faria os índices falharem e
-- derrubariam a transação inteira, arrastando o backfill junto.
set search_path = public, extensions;

alter table public.leads
  add column if not exists canal text,
  add column if not exists referrer text,
  add column if not exists landing_path text,
  add column if not exists form_path text,
  add column if not exists consent boolean,
  add column if not exists consent_ts timestamptz,
  add column if not exists consent_marketing boolean;

comment on column public.leads.canal is
  'Origem normalizada (google-ads, meta-ads, google-organico, social, whatsapp, referencia, direto, outro). Gravada no insert pela mesma cascata de src/lib/leadOrigem.ts.';
comment on column public.leads.referrer is 'document.referrer da primeira página vista na sessão.';
comment on column public.leads.landing_path is 'Caminho por onde a pessoa ENTROU no site (first touch).';
comment on column public.leads.form_path is 'Caminho de onde ela CONVERTEU (last touch). page_url guarda a URL inteira.';
comment on column public.leads.consent is 'Aceite do formulário no momento do envio. É a prova de consentimento exigida pela LGPD.';
comment on column public.leads.consent_marketing is 'Consentimento de cookies de marketing: é ele que libera PII para a Meta.';

-- Preenche o histórico com a mesma regra, para o filtro por origem não nascer
-- cego aos leads que já estão na base.
--
-- O degrau de referrer da cascata do TypeScript não aparece aqui de propósito:
-- a coluna nasce nesta migration, então todo lead antigo tem referrer nulo e o
-- degrau nunca decidiria nada. Lead novo passa pela cascata completa no insert.
update public.leads set canal = case
  when gclid is not null and gclid <> '' then 'google-ads'
  when fbclid is not null and fbclid <> '' then 'meta-ads'
  when coalesce(utm_source, '') <> '' then case
    when lower(utm_source) like '%google%' then
      case when lower(coalesce(utm_medium, '')) ~ '(cpc|paid|ads)' then 'google-ads' else 'google-organico' end
    when lower(utm_source) ~ '(face|meta|instagram)' or lower(utm_source) ~ '(^|[^a-z0-9])ig([^a-z0-9]|$)' then
      case when lower(coalesce(utm_medium, '')) ~ '(cpc|paid|ads)' then 'meta-ads' else 'social' end
    when lower(utm_source) ~ '(tiktok|youtube|linkedin)' then 'social'
    when lower(utm_source) like '%whats%' then 'whatsapp'
    else 'outro'
  end
  when coalesce(source, '') like 'whatsapp:%' then 'whatsapp'
  else 'direto'
end
where canal is null;

create index if not exists idx_leads_canal on public.leads(canal);
create index if not exists idx_leads_interesse on public.leads(interesse);

-- Busca por nome, telefone e e-mail: o ilike da tela roda sem índice hoje.
-- Trigrama é o que faz "%maria%" usar índice em vez de varrer a tabela.
--
-- O operator class é referenciado SEM qualificar o schema porque o search_path
-- do Supabase já inclui extensions; qualificar quebraria numa base onde a
-- extensão foi criada em public. O bloco abaixo também não falha se a extensão
-- já existir em outro schema.
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_trgm') then
    create extension pg_trgm with schema extensions;
  end if;
end $$;

create index if not exists idx_leads_nome_trgm on public.leads using gin (nome gin_trgm_ops);
create index if not exists idx_leads_whatsapp_trgm on public.leads using gin (whatsapp gin_trgm_ops);
create index if not exists idx_leads_email_trgm on public.leads using gin (email gin_trgm_ops);

-- Opções do filtro de interesse.
--
-- Sem isto a tela puxava 1000 linhas e deduplicava no servidor, o que corta no
-- alfabeto assim que a base crescer: um interesse que só aparece depois da
-- milésima linha simplesmente sumia do filtro. security_invoker faz a view
-- herdar a RLS de leads em vez de rodar como dona.
create or replace view public.leads_interesses
with (security_invoker = true) as
  select distinct interesse
  from public.leads
  where interesse is not null and interesse <> ''
  order by interesse;

comment on view public.leads_interesses is
  'Valores distintos de interesse, para o select de filtro do painel. Herda a RLS de leads.';
