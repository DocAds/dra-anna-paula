# Supabase setup — Dra. Anna Bomtempo

## Passos para configurar

### 1. Criar projeto Supabase
- Acesse https://supabase.com/dashboard
- Novo projeto: `dra-anna-bomtempo`
- Anote a **URL** e a **anon key** (Settings → API)

### 2. Rodar a migration
- SQL Editor → cole `migrations/001_init.sql` → Run
- Cria: tabelas `profiles` e `posts`, enums, RLS, trigger de auto-criação de profile, bucket `blog`

### 3. Configurar `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...   # só usado em rotas server para CRUD de users
```

### 4. Criar usuário admin inicial
- Authentication → Users → Add user → Email + senha
- SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'seu@email.com';
```

### 5. Pronto
- `/login` aceita o email criado
- `/admin` libera o dashboard

## Storage
- Bucket `blog` (público pra leitura)
- Upload de imagens dos posts vai pra `blog/cover/{post_id}/{filename}`
- Editor cola URL pública do Supabase Storage no `<img>`

## Compliance médico
- Posts são conteúdo educativo, NÃO podem incluir:
  - Imagens antes-e-depois de pacientes
  - Depoimentos com promessa de resultado
  - Valores comerciais ou promoções
