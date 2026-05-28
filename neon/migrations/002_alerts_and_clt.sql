-- Migração 002: Alertas de contas a vencer + Distribuição CLT
-- Execute no SQL Editor do Neon

-- ─── Alertas de contas ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  due_date        DATE NOT NULL,
  reminder_days   INTEGER NOT NULL DEFAULT 3,
  expected_value  NUMERIC,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alerts_user_due_idx ON public.alerts (user_id, due_date);

-- ─── Distribuição de salário CLT ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clt_distribution_months (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month       TEXT NOT NULL,
  salary      NUMERIC NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);

CREATE TABLE IF NOT EXISTS public.clt_distribution_categories (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month      TEXT NOT NULL,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clt_distribution_items (
  id          TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.clt_distribution_categories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  value       NUMERIC NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
