-- ============================================================================
-- Dra. Anna Bomtempo · Schema inicial (profiles + posts + storage)
-- ============================================================================

-- Extensões
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================================
-- ENUM de roles e status
-- ============================================================================
do $$ begin
  create type user_role as enum ('admin', 'editor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- TABELA: profiles (estende auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  role user_role not null default 'editor',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_role on public.profiles(role);

-- Trigger: ao criar usuário em auth.users, criar profile com role default
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'editor')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- TABELA: posts
-- ============================================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text default '',
  cover_image text,
  category text,
  status post_status not null default 'draft',
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_posts_status on public.posts(status);
create index if not exists idx_posts_slug on public.posts(slug);
create index if not exists idx_posts_published_at on public.posts(published_at desc);
create index if not exists idx_posts_author on public.posts(author_id);

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ============================================================================
-- HELPER: is_admin (security definer p/ evitar recursão RLS)
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- RLS: profiles
-- ============================================================================
alter table public.profiles enable row level security;

-- Limpa policies antigas
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
drop policy if exists "profiles_insert_admin" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;

create policy "profiles_select_self_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_self_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (
    -- só admin pode mudar role
    (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()))
    or public.is_admin()
  );

create policy "profiles_insert_admin"
  on public.profiles for insert
  with check (public.is_admin());

create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin() and id <> auth.uid());

-- ============================================================================
-- RLS: posts
-- ============================================================================
alter table public.posts enable row level security;

drop policy if exists "posts_select_published_public" on public.posts;
drop policy if exists "posts_select_all_authenticated" on public.posts;
drop policy if exists "posts_insert_authenticated" on public.posts;
drop policy if exists "posts_update_own_or_admin" on public.posts;
drop policy if exists "posts_delete_own_or_admin" on public.posts;

-- Leitura pública: só posts publicados
create policy "posts_select_published_public"
  on public.posts for select
  to anon
  using (status = 'published');

-- Authenticated vê tudo (admin) ou só os seus + publicados (editor)
create policy "posts_select_all_authenticated"
  on public.posts for select
  to authenticated
  using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_admin()
  );

create policy "posts_insert_authenticated"
  on public.posts for insert
  to authenticated
  with check (author_id = auth.uid() or public.is_admin());

create policy "posts_update_own_or_admin"
  on public.posts for update
  to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create policy "posts_delete_own_or_admin"
  on public.posts for delete
  to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- ============================================================================
-- STORAGE: bucket "blog" para covers e mídia dos posts
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;

drop policy if exists "blog_storage_read_public" on storage.objects;
drop policy if exists "blog_storage_write_authenticated" on storage.objects;
drop policy if exists "blog_storage_update_authenticated" on storage.objects;
drop policy if exists "blog_storage_delete_authenticated" on storage.objects;

create policy "blog_storage_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'blog');

create policy "blog_storage_write_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog');

create policy "blog_storage_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog');

create policy "blog_storage_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog');

-- ============================================================================
-- SEED: criar usuário admin inicial via SQL
-- (rode separadamente após criar o usuário no Supabase Auth)
-- ============================================================================
-- exemplo (substitua o email):
-- update public.profiles set role = 'admin' where email = 'adm@docads.com.br';
