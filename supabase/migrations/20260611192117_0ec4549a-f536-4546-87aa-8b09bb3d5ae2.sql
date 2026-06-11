ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS cash_value_manual boolean NOT NULL DEFAULT false;