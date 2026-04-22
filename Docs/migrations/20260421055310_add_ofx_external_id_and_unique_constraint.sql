-- 1. Cria a coluna para receber o ID do OFX
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 2. Remove o índice antigo (se existir) para evitar conflitos
DROP INDEX IF EXISTS idx_transactions_external_id;

-- 3. Adiciona a blindagem absoluta contra duplicações
ALTER TABLE public.transactions ADD CONSTRAINT transactions_external_id_key UNIQUE (external_id);
