-- Campos de SEO avançado para posts do blog (estilo CANPP).
-- Idempotente: pode rodar mais de uma vez sem erro.
alter table public.posts
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists focus_keyword text,
  add column if not exists seo_keywords text[],
  add column if not exists canonical_url text,
  add column if not exists og_image_url text,
  add column if not exists no_index boolean not null default false;
