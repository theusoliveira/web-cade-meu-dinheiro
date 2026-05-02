-- Otimização do saldo automático entre meses.
-- Execute este script no SQL Editor do Supabase ou via Supabase CLI.
-- Ele não altera dados existentes; cria índices e uma função RPC.

create index if not exists entries_date_idx
  on public.entries (date);

create index if not exists entries_date_category_idx
  on public.entries (date, category);

create index if not exists entries_fixed_entry_id_idx
  on public.entries (fixed_entry_id);

create index if not exists card_entries_date_created_at_idx
  on public.card_entries (date desc, created_at desc);

create or replace function public.get_opening_balance(month_start date)
returns numeric
language sql
stable
set search_path = public
as $$
  with last_saldo_month as (
    select date_trunc('month', e.date)::date as ym
    from public.entries e
    where e.date < month_start
      and lower(trim(e.category)) = 'saldo'
    order by ym desc
    limit 1
  ),
  saldo_base as (
    select coalesce(
      sum(case when e.kind = 'income' then e.value else -e.value end),
      0
    ) as amount
    from public.entries e
    where exists (select 1 from last_saldo_month)
      and e.date >= (select ym from last_saldo_month)
      and e.date < ((select ym from last_saldo_month) + interval '1 month')
      and lower(trim(e.category)) = 'saldo'
  ),
  movements as (
    select coalesce(
      sum(case when e.kind = 'income' then e.value else -e.value end),
      0
    ) as amount
    from public.entries e
    where e.date < month_start
      and lower(trim(e.category)) <> 'saldo'
      and (
        not exists (select 1 from last_saldo_month)
        or e.date >= (select ym from last_saldo_month)
      )
  )
  select round(
    coalesce((select amount from saldo_base), 0) +
    coalesce((select amount from movements), 0),
    2
  );
$$;
