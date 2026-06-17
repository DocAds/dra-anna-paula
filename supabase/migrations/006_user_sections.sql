-- Acesso por seção do admin, controlado pelo usuário master.
-- Admins ignoram isto (acesso total). Editores veem só as seções liberadas.
alter table public.profiles add column if not exists sections text[] not null default '{}';

-- Backfill: editores que já existiam mantêm o acesso que tinham.
update public.profiles
  set sections = ARRAY['painel','dashboard','leads','posts']
  where role = 'editor' and (sections is null or sections = '{}');
