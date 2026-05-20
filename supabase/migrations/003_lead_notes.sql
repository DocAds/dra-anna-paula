create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lead_notes_lead on public.lead_notes(lead_id, created_at desc);

drop trigger if exists set_lead_notes_updated_at on public.lead_notes;
create trigger set_lead_notes_updated_at
  before update on public.lead_notes
  for each row execute function public.set_updated_at();

alter table public.lead_notes enable row level security;

drop policy if exists "lead_notes_select_auth" on public.lead_notes;
drop policy if exists "lead_notes_insert_auth" on public.lead_notes;
drop policy if exists "lead_notes_update_auth" on public.lead_notes;
drop policy if exists "lead_notes_delete_auth" on public.lead_notes;

create policy "lead_notes_select_auth" on public.lead_notes for select to authenticated using (true);
create policy "lead_notes_insert_auth" on public.lead_notes for insert to authenticated with check (true);
create policy "lead_notes_update_auth" on public.lead_notes for update to authenticated using (author_id = auth.uid() or public.is_admin()) with check (true);
create policy "lead_notes_delete_auth" on public.lead_notes for delete to authenticated using (author_id = auth.uid() or public.is_admin());
