-- Tabelas para a funcionalidade "Distribuição de Salário PJ"

-- Inputs de faturamento por mês (horas, valor hora, comissão, flag de simples automático)
create table if not exists public.pj_distribution_months (
  id           text primary key,
  month        text not null,          -- YYYY-MM
  hours        numeric not null default 0,
  hourly_rate  numeric not null default 0,
  commission   numeric not null default 0,
  simples_auto boolean not null default true,
  created_at   timestamptz not null default now()
);

create unique index if not exists pj_distribution_months_month_idx
  on public.pj_distribution_months (month);

-- Categorias de distribuição por mês
create table if not exists public.pj_distribution_categories (
  id         text primary key,
  month      text not null,
  name       text not null,
  is_fixed   boolean not null default false, -- true = "Despesas PJ"
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists pj_distribution_categories_month_idx
  on public.pj_distribution_categories (month, sort_order);

-- Itens dentro de cada categoria
create table if not exists public.pj_distribution_items (
  id          text primary key,
  category_id text not null references public.pj_distribution_categories(id) on delete cascade,
  description text not null,
  value       numeric not null default 0,
  item_key    text,                     -- identificador interno: 'contabilidade' | 'simples_nacional' | 'inss'
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists pj_distribution_items_category_idx
  on public.pj_distribution_items (category_id, sort_order);

-- RLS
alter table public.pj_distribution_months     enable row level security;
alter table public.pj_distribution_categories enable row level security;
alter table public.pj_distribution_items      enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pj_distribution_months' and policyname='pj_dist_months_auth') then
    create policy pj_dist_months_auth on public.pj_distribution_months
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pj_distribution_categories' and policyname='pj_dist_categories_auth') then
    create policy pj_dist_categories_auth on public.pj_distribution_categories
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pj_distribution_items' and policyname='pj_dist_items_auth') then
    create policy pj_dist_items_auth on public.pj_distribution_items
      for all to authenticated using (true) with check (true);
  end if;
end $$;

grant select, insert, update, delete on public.pj_distribution_months     to authenticated;
grant select, insert, update, delete on public.pj_distribution_categories to authenticated;
grant select, insert, update, delete on public.pj_distribution_items      to authenticated;
