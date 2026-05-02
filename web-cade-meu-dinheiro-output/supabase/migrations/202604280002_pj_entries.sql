-- Estrutura independente para a aba "Lançamentos PJ".
-- Execute este script no SQL Editor do Supabase depois da migration anterior.
-- Ele cria tabelas novas; não copia nem altera lançamentos pessoais existentes.

create table if not exists public.pj_fixed_entries (
  id text primary key,
  kind text not null check (kind in ('income', 'expense', 'investment')),
  category text not null,
  description text not null,
  day_of_month integer not null check (day_of_month between 1 and 31),
  created_at timestamptz not null default now()
);

create table if not exists public.pj_entries (
  id text primary key,
  kind text not null check (kind in ('income', 'expense', 'investment')),
  date date not null,
  category text not null,
  description text,
  value numeric not null check (value >= 0),
  fixed_entry_id text references public.pj_fixed_entries(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists pj_entries_date_idx
  on public.pj_entries (date);

create index if not exists pj_entries_date_category_idx
  on public.pj_entries (date, category);

create index if not exists pj_entries_fixed_entry_id_idx
  on public.pj_entries (fixed_entry_id);

create index if not exists pj_fixed_entries_created_at_idx
  on public.pj_fixed_entries (created_at desc);

alter table public.pj_entries enable row level security;
alter table public.pj_fixed_entries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pj_entries'
      and policyname = 'pj_entries_authenticated_all'
  ) then
    create policy pj_entries_authenticated_all
      on public.pj_entries
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pj_fixed_entries'
      and policyname = 'pj_fixed_entries_authenticated_all'
  ) then
    create policy pj_fixed_entries_authenticated_all
      on public.pj_fixed_entries
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

grant select, insert, update, delete on public.pj_entries to authenticated;
grant select, insert, update, delete on public.pj_fixed_entries to authenticated;

create or replace function public.get_pj_opening_balance(month_start date)
returns numeric
language sql
stable
set search_path = public
as $$
  with last_saldo_month as (
    select date_trunc('month', e.date)::date as ym
    from public.pj_entries e
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
    from public.pj_entries e
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
    from public.pj_entries e
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

grant execute on function public.get_pj_opening_balance(date) to authenticated;
