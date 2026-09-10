-- ============================================================================
-- Limites nas colunas de origem criadas pela 010
-- ============================================================================
--
-- A truncagem em idsDaOrigem() só vale para quem passa pela rota /api/lead. A
-- policy leads_insert_anyone segue liberando insert direto com a chave anon,
-- que é pública: sem constraint, dá para inflar o registro por fora da rota,
-- sem passar nem pela validação nem pelo limite de envios por hora.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_campaign_id_len') then
    alter table public.leads add constraint leads_campaign_id_len
      check (campaign_id is null or char_length(campaign_id) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_adset_id_len') then
    alter table public.leads add constraint leads_adset_id_len
      check (adset_id is null or char_length(adset_id) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_ad_id_len') then
    alter table public.leads add constraint leads_ad_id_len
      check (ad_id is null or char_length(ad_id) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_origem_extra_shape') then
    alter table public.leads add constraint leads_origem_extra_shape
      check (
        origem_extra is null
        or (jsonb_typeof(origem_extra) = 'object' and pg_column_size(origem_extra) <= 4000)
      );
  end if;
end $$;
