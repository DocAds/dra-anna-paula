-- ============================================================================
-- Identificadores de campanha que já chegavam na URL e ninguém guardava
-- ============================================================================
--
-- Dos 9 leads do Google no histórico, ZERO tem utm_campaign, e mesmo assim 7
-- carregam `gad_campaignid=24007273607` dentro do próprio `page_url`: o número
-- da campanha viajou até o formulário e foi descartado na gravação. O mesmo
-- vale para `gbraid`, que substitui o gclid em parte do tráfego de iOS.
--
-- Guardar isso não depende de mexer em nenhuma conta de anúncio, e é o caminho
-- mais curto entre "veio do Google" e "veio da campanha X".

alter table public.leads
  add column if not exists campaign_id text,
  add column if not exists adset_id text,
  add column if not exists ad_id text,
  add column if not exists origem_extra jsonb;

comment on column public.leads.campaign_id is
  'ID da campanha: utm_id (Meta) ou gad_campaignid (Google). Junta o lead com o relatório da plataforma sem depender do nome, que muda.';
comment on column public.leads.adset_id is 'ID do conjunto de anúncios (Meta).';
comment on column public.leads.ad_id is 'ID do anúncio ou criativo.';
comment on column public.leads.origem_extra is
  'Demais parâmetros da URL de origem (gbraid, wbraid, matchtype, network, device, placement, ttclid). Guardados crus porque cada plataforma inventa os seus.';

create index if not exists idx_leads_campaign_id on public.leads(campaign_id);

-- Recupera o que dá do histórico: o gad_campaignid está dentro da page_url dos
-- leads que vieram do Google.
update public.leads
set campaign_id = substring(page_url from 'gad_campaignid=([0-9]+)')
where campaign_id is null
  and page_url like '%gad_campaignid=%';

-- Ordenação e agrupamento por campanha na tela de origem.
create or replace view public.leads_por_campanha
with (security_invoker = true) as
  select
    canal,
    coalesce(nullif(utm_campaign, ''), campaign_id, '(sem campanha)') as campanha,
    count(*) as leads,
    count(*) filter (where fase in ('agendado', 'compareceu', 'convertido')) as agendados,
    count(*) filter (where fase = 'convertido') as convertidos,
    min(created_at) as primeiro,
    max(created_at) as ultimo
  from public.leads
  group by 1, 2;

comment on view public.leads_por_campanha is
  'Leads agrupados por canal e campanha, com o funil. Herda a RLS de leads.';

grant select on public.leads_por_campanha to anon, authenticated;
