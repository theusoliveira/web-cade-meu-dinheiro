-- Migração 001: Índices de performance e constraint anti-duplicata
-- Execute no SQL Editor do Neon após o schema inicial

-- Índice para busca de categorias por usuário+mês
CREATE INDEX IF NOT EXISTS pj_dist_categories_user_month_idx
  ON public.pj_distribution_categories (user_id, month, sort_order);

-- Índice para join de itens por category_id
CREATE INDEX IF NOT EXISTS pj_dist_items_category_idx
  ON public.pj_distribution_items (category_id, sort_order);

-- Índice de metas por usuário
CREATE INDEX IF NOT EXISTS goals_user_forecast_idx
  ON public.goals (user_id, forecast ASC);

-- CONSTRAINT: garante no máximo uma categoria "fixa" por usuário/mês
-- Isso previne o bug de duplicidade de "Despesas PJ" no banco de dados
CREATE UNIQUE INDEX IF NOT EXISTS pj_dist_categories_one_fixed_per_month_idx
  ON public.pj_distribution_categories (user_id, month)
  WHERE is_fixed = true;
