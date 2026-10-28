-- Migração 005: Objetivos (projeção de conclusão por aporte mensal + taxa)
CREATE TABLE IF NOT EXISTS public.objectives (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  initial_value        NUMERIC NOT NULL DEFAULT 0,
  target_value         NUMERIC NOT NULL DEFAULT 0,
  monthly_contribution NUMERIC NOT NULL DEFAULT 0,
  monthly_rate         NUMERIC NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS objectives_user_idx ON public.objectives (user_id, created_at);
