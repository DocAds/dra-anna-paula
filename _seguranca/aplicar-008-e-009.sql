-- ============================================================================
-- APLICAR NO SQL EDITOR DO SUPABASE (projeto qhadzqreqfjdjujwysfo)
--
-- Cole este arquivo inteiro e rode uma vez só. São as migrations 008 e 009 na
-- ordem certa. Tudo é idempotente: rodar duas vezes não duplica nada.
--
-- O que a 008 faz: colunas de origem (canal, referrer, landing_path,
-- form_path), colunas de consentimento, preenchimento do canal para os leads
-- que já existem, índices de busca e a view de interesses.
--
-- O que a 009 faz: fecha a permissão no BANCO. Hoje qualquer conta do painel,
-- mesmo sem a seção Leads, lê e altera a base inteira de pacientes falando
-- direto com a API. Também tranca a prova de consentimento e restringe o token
-- de IA a admin.
--
-- Depois de rodar, o resultado esperado da última consulta é 4 linhas com as
-- policies novas de leads.
-- ============================================================================


-- ############################ MIGRATION 008 ################################

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
set local search_path = public, extensions;

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


-- ############################ MIGRATION 009 ################################

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


-- ######################## CONFERÊNCIA (opcional) ###########################
-- Deve listar leads_select_section, leads_update_section e as duas de notas.
select tablename, policyname
from pg_policies
where schemaname = 'public' and tablename in ('leads', 'lead_notes')
order by tablename, policyname;
