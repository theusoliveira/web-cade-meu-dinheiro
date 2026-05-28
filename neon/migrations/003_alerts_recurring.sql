-- Migração 003: Suporte a alertas recorrentes (dia do mês fixo)
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS recurring     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS day_of_month  INTEGER CHECK (day_of_month BETWEEN 1 AND 31);
