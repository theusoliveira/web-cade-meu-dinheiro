-- Tabelas para a funcionalidade "Distribuição de salário PJ"
-- Execute no SQL Editor do Supabase após as migrations anteriores.

-- Configurações mensais: horas, valor hora, comissão e despesas PJ fixas
create table if not exists public.pj_salary_settings (
  id text primary key,
  month_year text not null unique, -- formato "YYYY-MM"
  hours numeric not null default 0,
  hourly_rate numeric not null default 0,
  commission numeric not null default 0,
  accounting numeric not null default 0,
  inss numeric not null default 0,
  simples_override numeric default null, -- se null, usa 6% automático
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categorias de alocação criadas pelo usuário por mês
create table if not exists public.pj_salary_categories (
  id text primary key,
  month_year text not null, -- formato "YYYY-MM"
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists pj_salary_categories_month_idx
  on public.pj_salary_categories (month_year);

-- Itens dentro de cada categoria
create table if not exists public.pj_salary_items (
  id text primary key,
  category_id text not null references public.pj_salary_categories(id) on delete cascade,
  description text not null,
  value numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists pj_salary_items_category_idx
  on public.pj_salary_items (category_id);

-- Row Level Security
alter table public.pj_salary_settings enable row level security;
alter table public.pj_salary_categories enable row level security;
alter table public.pj_salary_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pj_salary_settings'
      and policyname = 'pj_salary_settings_authenticated_all'
  ) then
    create policy pj_salary_settings_authenticated_all
      on public.pj_salary_settings for all to authenticated
      using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pj_salary_categories'
      and policyname = 'pj_salary_categories_authenticated_all'
  ) then
    create policy pj_salary_categories_authenticated_all
      on public.pj_salary_categories for all to authenticated
      using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pj_salary_items'
      and policyname = 'pj_salary_items_authenticated_all'
  ) then
    create policy pj_salary_items_authenticated_all
      on public.pj_salary_items for all to authenticated
      using (true) with check (true);
  end if;
end $$;

grant select, insert, update, delete on public.pj_salary_settings to authenticated;
grant select, insert, update, delete on public.pj_salary_categories to authenticated;
grant select, insert, update, delete on public.pj_salary_items to authenticated;
