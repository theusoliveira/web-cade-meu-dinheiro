# Cadê meu dinheiro?

App de controle financeiro pessoal em Next.js + Supabase.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Variáveis de ambiente

Crie `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Também é aceito o nome mais novo da chave pública do Supabase:

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Migrations do Supabase

A pasta `supabase/migrations/` deve ficar versionada no GitHub. Ela documenta as mudanças necessárias no banco.

Execute os scripts pelo **SQL Editor** do Supabase, colando o conteúdo de cada arquivo, ou pela Supabase CLI se o projeto estiver configurado.

### Saldo automático dos lançamentos pessoais

```txt
supabase/migrations/202604280001_opening_balance.sql
```

Esse script cria índices e a função RPC `get_opening_balance(month_start date)`.

### Aba Lançamentos PJ

```txt
supabase/migrations/202604280002_pj_entries.sql
```

Esse script cria as tabelas independentes `pj_entries` e `pj_fixed_entries`, os índices e a função RPC `get_pj_opening_balance(month_start date)`.

A aba **Lançamentos PJ** começa vazia e não replica os dados já cadastrados em **Lançamentos**.

## Scripts úteis

```bash
npm run lint
npm run build
```

## Organização do código

- `components/` - UI e telas.
- `hooks/` - estado e carregamento de dados por contexto.
- `lib/finance/` - regras financeiras, datas, formatação e saldo.
- `lib/supabase/queries/` - acesso ao Supabase centralizado.
- `supabase/migrations/` - scripts SQL para aplicar no projeto Supabase.
