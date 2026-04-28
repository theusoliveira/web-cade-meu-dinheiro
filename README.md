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

## Otimização do saldo automático

A aba **Lançamentos** carrega automaticamente o saldo acumulado dos meses anteriores.

Para o melhor desempenho, execute no Supabase o script:

```txt
supabase/migrations/202604280001_opening_balance.sql
```

Esse script cria índices e a função RPC `get_opening_balance(month_start date)`.

Se a função ainda não existir, o app continua funcionando com fallback no frontend, mas o cálculo pode ficar mais pesado com muitos lançamentos históricos.

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
