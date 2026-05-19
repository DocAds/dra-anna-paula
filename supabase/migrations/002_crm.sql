-- ============================================================================
-- CRM: leads + dashboard
-- ============================================================================

do $$ begin
  create type lead_temperatura as enum ('frio', 'morno', 'quente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_fase as enum ('novo', 'contatado', 'agendado', 'compareceu', 'convertido', 'perdido');
exception when duplicate_object then null; end $$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  nome text not null,
  whatsapp text not null,
  whatsapp_country text default 'BR',
  email text,
  cidade text,
  interesse text,
  urgencia text,
  mensagem text,

  source text,
  page_url text,
  user_agent text,
  ip_country text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  gclid text,
  fbclid text,

  temperatura lead_temperatura default 'morno',
  fase lead_fase default 'novo',
  assigned_to uuid references public.profiles(id) on delete set null,
  notas text
);

create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_fase on public.leads(fase);
create index if not exists idx_leads_temperatura on public.leads(temperatura);
create index if not exists idx_leads_source on public.leads(source);
create index if not exists idx_leads_assigned on public.leads(assigned_to);

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

alter table public.leads enable row level security;

drop policy if exists "leads_insert_anyone" on public.leads;
drop policy if exists "leads_select_auth" on public.leads;
drop policy if exists "leads_update_auth" on public.leads;
drop policy if exists "leads_delete_admin" on public.leads;

create policy "leads_insert_anyone"
  on public.leads for insert
  to anon, authenticated
  with check (true);

create policy "leads_select_auth"
  on public.leads for select
  to authenticated
  using (true);

create policy "leads_update_auth"
  on public.leads for update
  to authenticated
  using (true)
  with check (true);

create policy "leads_delete_admin"
  on public.leads for delete
  to authenticated
  using (public.is_admin());
