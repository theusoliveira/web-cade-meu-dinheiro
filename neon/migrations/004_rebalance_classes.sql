-- Migração 004: Rebalanceador de carteira
CREATE TABLE IF NOT EXISTS public.rebalance_classes (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  target_percent NUMERIC NOT NULL DEFAULT 0,
  current_value  NUMERIC NOT NULL DEFAULT 0,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rebalance_classes_user_idx ON public.rebalance_classes (user_id, sort_order);
