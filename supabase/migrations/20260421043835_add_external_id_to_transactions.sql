ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON public.transactions(external_id);
