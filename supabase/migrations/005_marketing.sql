-- Configurações de marketing/tracking gerenciadas pelo admin.
-- Linha única (id = 1). Segredos (token CAPI) só são lidos no servidor.
create table if not exists public.marketing_settings (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default true,
  -- Google
  gtm_id text,
  ga4_id text,
  google_ads_id text,
  google_ads_conversions jsonb not null default '[]'::jsonb,
  -- Meta
  meta_pixel_id text,
  meta_capi_token text,
  meta_capi_test_code text,
  -- TikTok
  tiktok_pixel_id text,
  -- Scripts livres
  custom_head text,
  custom_body text,
  updated_at timestamptz default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.marketing_settings (id) values (1) on conflict (id) do nothing;

alter table public.marketing_settings enable row level security;
drop policy if exists "mkt_select_admin" on public.marketing_settings;
drop policy if exists "mkt_select_auth" on public.marketing_settings;
drop policy if exists "mkt_write_admin" on public.marketing_settings;
-- Leitura só para admin (o site público lê via service role no servidor).
create policy "mkt_select_admin" on public.marketing_settings
  for select to authenticated using (public.is_admin());
create policy "mkt_write_admin" on public.marketing_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
