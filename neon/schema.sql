-- Execute este script no SQL Editor do Neon antes de rodar o projeto.

CREATE TABLE IF NOT EXISTS public.users (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email        TEXT NOT NULL UNIQUE,
  password     TEXT NOT NULL,
  full_name    TEXT,
  display_name TEXT,
  cpf          TEXT UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entries (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'investment')),
  date           DATE NOT NULL,
  category       TEXT NOT NULL,
  description    TEXT,
  value          NUMERIC NOT NULL CHECK (value >= 0),
  fixed_entry_id TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS entries_user_date_idx ON public.entries (user_id, date);
CREATE INDEX IF NOT EXISTS entries_date_idx ON public.entries (date);
CREATE INDEX IF NOT EXISTS entries_date_category_idx ON public.entries (date, category);
CREATE INDEX IF NOT EXISTS entries_fixed_entry_id_idx ON public.entries (fixed_entry_id);

CREATE TABLE IF NOT EXISTS public.fixed_entries (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'investment')),
  category     TEXT NOT NULL,
  description  TEXT NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.card_entries (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'investment')),
  date        DATE NOT NULL,
  category    TEXT NOT NULL,
  description TEXT,
  value       NUMERIC NOT NULL CHECK (value >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS card_entries_user_date_idx ON public.card_entries (user_id, date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.goals (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  description   TEXT,
  current_value NUMERIC,
  target_value  NUMERIC,
  forecast      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pj_entries (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'investment')),
  date           DATE NOT NULL,
  category       TEXT NOT NULL,
  description    TEXT,
  value          NUMERIC NOT NULL CHECK (value >= 0),
  fixed_entry_id TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pj_entries_user_date_idx ON public.pj_entries (user_id, date);
CREATE INDEX IF NOT EXISTS pj_entries_date_idx ON public.pj_entries (date);

CREATE TABLE IF NOT EXISTS public.pj_fixed_entries (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('income', 'expense', 'investment')),
  category     TEXT NOT NULL,
  description  TEXT NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pj_distribution_months (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month        TEXT NOT NULL,
  hours        NUMERIC NOT NULL DEFAULT 0,
  hourly_rate  NUMERIC NOT NULL DEFAULT 0,
  commission   NUMERIC NOT NULL DEFAULT 0,
  simples_auto BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);

CREATE TABLE IF NOT EXISTS public.pj_distribution_categories (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month      TEXT NOT NULL,
  name       TEXT NOT NULL,
  is_fixed   BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pj_distribution_items (
  id          TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.pj_distribution_categories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  value       NUMERIC NOT NULL DEFAULT 0,
  item_key    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Funções RPC
CREATE OR REPLACE FUNCTION public.get_opening_balance(p_user_id TEXT, month_start DATE)
RETURNS NUMERIC LANGUAGE SQL STABLE AS $$
  WITH last_saldo_month AS (
    SELECT date_trunc('month', e.date)::date AS ym
    FROM public.entries e
    WHERE e.user_id = p_user_id AND e.date < month_start AND lower(trim(e.category)) = 'saldo'
    ORDER BY ym DESC LIMIT 1
  ),
  saldo_base AS (
    SELECT COALESCE(SUM(CASE WHEN e.kind = 'income' THEN e.value ELSE -e.value END), 0) AS amount
    FROM public.entries e
    WHERE e.user_id = p_user_id
      AND EXISTS (SELECT 1 FROM last_saldo_month)
      AND e.date >= (SELECT ym FROM last_saldo_month)
      AND e.date < ((SELECT ym FROM last_saldo_month) + INTERVAL '1 month')
      AND lower(trim(e.category)) = 'saldo'
  ),
  movements AS (
    SELECT COALESCE(SUM(CASE WHEN e.kind = 'income' THEN e.value ELSE -e.value END), 0) AS amount
    FROM public.entries e
    WHERE e.user_id = p_user_id AND e.date < month_start AND lower(trim(e.category)) <> 'saldo'
      AND (NOT EXISTS (SELECT 1 FROM last_saldo_month) OR e.date >= (SELECT ym FROM last_saldo_month))
  )
  SELECT ROUND(COALESCE((SELECT amount FROM saldo_base), 0) + COALESCE((SELECT amount FROM movements), 0), 2);
$$;

CREATE OR REPLACE FUNCTION public.get_pj_opening_balance(p_user_id TEXT, month_start DATE)
RETURNS NUMERIC LANGUAGE SQL STABLE AS $$
  WITH last_saldo_month AS (
    SELECT date_trunc('month', e.date)::date AS ym
    FROM public.pj_entries e
    WHERE e.user_id = p_user_id AND e.date < month_start AND lower(trim(e.category)) = 'saldo'
    ORDER BY ym DESC LIMIT 1
  ),
  saldo_base AS (
    SELECT COALESCE(SUM(CASE WHEN e.kind = 'income' THEN e.value ELSE -e.value END), 0) AS amount
    FROM public.pj_entries e
    WHERE e.user_id = p_user_id
      AND EXISTS (SELECT 1 FROM last_saldo_month)
      AND e.date >= (SELECT ym FROM last_saldo_month)
      AND e.date < ((SELECT ym FROM last_saldo_month) + INTERVAL '1 month')
      AND lower(trim(e.category)) = 'saldo'
  ),
  movements AS (
    SELECT COALESCE(SUM(CASE WHEN e.kind = 'income' THEN e.value ELSE -e.value END), 0) AS amount
    FROM public.pj_entries e
    WHERE e.user_id = p_user_id AND e.date < month_start AND lower(trim(e.category)) <> 'saldo'
      AND (NOT EXISTS (SELECT 1 FROM last_saldo_month) OR e.date >= (SELECT ym FROM last_saldo_month))
  )
  SELECT ROUND(COALESCE((SELECT amount FROM saldo_base), 0) + COALESCE((SELECT amount FROM movements), 0), 2);
$$;
