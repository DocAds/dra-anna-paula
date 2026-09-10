-- ============================================================================
-- Permissão no banco, não só na tela
-- ============================================================================
--
-- O painel já esconde as seções que o usuário não tem (requireSection, em
-- src/lib/admin-guard.ts), mas isso é gate de ROTA: quem abre o devtools e usa
-- o mesmo cliente Supabase que a página carregou fala direto com a API, e as
-- policies atuais respondem `using (true)` para qualquer authenticated.
--
-- Na prática, hoje um editor SEM a seção "leads" consegue ler nome, telefone,
-- e-mail, mensagem e utm de todos os leads, e alterar fase, temperatura e notas
-- de qualquer um. Botão escondido não é controle de acesso.

-- Uma função só, usada por todas as policies de seção. SECURITY DEFINER porque
-- precisa ler profiles sem esbarrar na RLS de profiles; search_path fixo e
-- nomes qualificados fecham o sequestro de search_path.
create or replace function public.has_section(secao text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.profiles
    where id = auth.uid() and secao = any(sections)
  );
$$;

comment on function public.has_section(text) is
  'Espelha no banco a checagem de seção do painel (requireSection). Admin vê tudo.';

-- ---------------------------------------------------------------- leads -----
drop policy if exists "leads_select_auth" on public.leads;
drop policy if exists "leads_update_auth" on public.leads;

-- O (select ...) faz o Postgres avaliar a função uma vez por consulta em vez de
-- uma vez por linha.
create policy "leads_select_section"
  on public.leads for select
  to authenticated
  using ((select public.has_section('leads')));

create policy "leads_update_section"
  on public.leads for update
  to authenticated
  using ((select public.has_section('leads')))
  with check ((select public.has_section('leads')));

-- ----------------------------------------------------------- lead_notes -----
drop policy if exists "lead_notes_select_auth" on public.lead_notes;
drop policy if exists "lead_notes_insert_auth" on public.lead_notes;

create policy "lead_notes_select_section"
  on public.lead_notes for select
  to authenticated
  using ((select public.has_section('leads')));

create policy "lead_notes_insert_section"
  on public.lead_notes for insert
  to authenticated
  with check (author_id = (select auth.uid()) and (select public.has_section('leads')));

-- O update checava quem PODE editar, mas o `with check (true)` deixava
-- reatribuir a nota a outro autor no mesmo comando.
drop policy if exists "lead_notes_update_auth" on public.lead_notes;
create policy "lead_notes_update_own_or_admin"
  on public.lead_notes for update
  to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()))
  with check (author_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------- ai_settings -----
-- A tabela guarda api_token em texto puro e era legível por QUALQUER usuário
-- autenticado. O padrão certo já existia no projeto: marketing_settings
-- (005_marketing.sql) restringe a is_admin(). Aqui só faltou aplicar.
drop policy if exists "ai_select_auth" on public.ai_settings;

create policy "ai_select_admin"
  on public.ai_settings for select
  to authenticated
  using ((select public.is_admin()));

-- ------------------------------------------------------- profiles.sections --
-- profiles_update_self_or_admin travava a troca de `role`, mas não a de
-- `sections`: um editor podia se autoliberar todas as seções do painel.
drop policy if exists "profiles_update_self_or_admin" on public.profiles;

create policy "profiles_update_self_or_admin"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (
    (select public.is_admin())
    or (
      id = (select auth.uid())
      and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
      and sections = (select p.sections from public.profiles p where p.id = (select auth.uid()))
    )
  );

-- --------------------------------------------------------- consentimento ----
-- Prova de consentimento que qualquer pessoa logada pode reescrever não é
-- prova. A LGPD (art. 8º, §5) põe no controlador o ônus de comprovar, então o
-- registro precisa ser imutável depois de gravado.
alter table public.leads
  add column if not exists consent_marketing_ts timestamptz,
  add column if not exists consent_version text;

comment on column public.leads.consent_marketing_ts is 'Quando o consentimento de cookies foi dado (pode ser anterior ao envio do formulário).';
comment on column public.leads.consent_version is 'Versão do texto de privacidade aceito, para provar o que a pessoa leu.';

create or replace function public.trava_consentimento()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.consent is not null and new.consent is distinct from old.consent then
    raise exception 'consent não pode ser alterado depois de registrado';
  end if;
  if old.consent_marketing is not null and new.consent_marketing is distinct from old.consent_marketing then
    raise exception 'consent_marketing não pode ser alterado depois de registrado';
  end if;
  if old.consent_ts is not null and new.consent_ts is distinct from old.consent_ts then
    raise exception 'consent_ts não pode ser alterado depois de registrado';
  end if;
  return new;
end;
$$;

drop trigger if exists leads_trava_consentimento on public.leads;
create trigger leads_trava_consentimento
  before update on public.leads
  for each row execute function public.trava_consentimento();

-- ------------------------------------------- limites no insert público ------
-- leads_insert_anyone libera INSERT para anon: a validação e o rate limit de
-- /api/lead só protegem quem passa pela rota. Com a chave anon (que é pública,
-- vai no HTML) dá para inserir direto, sem passar por nada disso.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_nome_len') then
    alter table public.leads add constraint leads_nome_len
      check (char_length(nome) between 2 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_whatsapp_len') then
    alter table public.leads add constraint leads_whatsapp_len
      check (char_length(whatsapp) between 8 and 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_mensagem_len') then
    alter table public.leads add constraint leads_mensagem_len
      check (mensagem is null or char_length(mensagem) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_email_len') then
    alter table public.leads add constraint leads_email_len
      check (email is null or char_length(email) <= 160);
  end if;
end $$;

-- ------------------------------------------------ blog: escrita e mídia -----
-- Mesma falha do CRM em outra porta: qualquer conta do painel (inclusive uma
-- que só cuida de leads) podia criar categoria e subir ou apagar arquivo no
-- bucket público do blog.
drop policy if exists "post_cat_write_auth" on public.post_categories;
create policy "post_cat_write_section"
  on public.post_categories for all
  to authenticated
  using ((select public.has_section('posts')))
  with check ((select public.has_section('posts')));

drop policy if exists "blog_storage_write_authenticated" on storage.objects;
drop policy if exists "blog_storage_update_authenticated" on storage.objects;
drop policy if exists "blog_storage_delete_authenticated" on storage.objects;

create policy "blog_storage_write_section"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog' and (select public.has_section('posts')));

create policy "blog_storage_update_section"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog' and (select public.has_section('posts')));

create policy "blog_storage_delete_section"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog' and (select public.has_section('posts')));

-- ------------------------------------------------- endurecimento menor ------
alter function public.is_admin() set search_path = public;
alter function public.handle_new_user() set search_path = public;

grant select on public.leads_interesses to anon, authenticated;
