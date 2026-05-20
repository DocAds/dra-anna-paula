create table if not exists public.post_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  created_at timestamptz default now()
);

alter table public.post_categories enable row level security;
drop policy if exists "post_cat_select_public" on public.post_categories;
drop policy if exists "post_cat_write_auth" on public.post_categories;
create policy "post_cat_select_public" on public.post_categories for select to anon, authenticated using (true);
create policy "post_cat_write_auth" on public.post_categories for all to authenticated using (true) with check (true);

create table if not exists public.ai_settings (
  id integer primary key default 1 check (id = 1),
  provider text not null default 'gemini',
  api_token text,
  instructions text,
  model text,
  updated_at timestamptz default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
insert into public.ai_settings (id, provider) values (1, 'gemini') on conflict (id) do nothing;

alter table public.ai_settings enable row level security;
drop policy if exists "ai_select_auth" on public.ai_settings;
drop policy if exists "ai_write_admin" on public.ai_settings;
create policy "ai_select_auth" on public.ai_settings for select to authenticated using (true);
create policy "ai_write_admin" on public.ai_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- seed inicial das 6 categorias atuais
insert into public.post_categories (name, slug) values
  ('Skincare', 'skincare'),
  ('Saúde', 'saude'),
  ('Lifestyle', 'lifestyle'),
  ('Tecnologia', 'tecnologia'),
  ('Medicina', 'medicina'),
  ('Nutrição', 'nutricao')
on conflict (name) do nothing;
