-- ControlFin - Migration: Adicionar CONSTRAINT UNIQUE para deduplicação OFX
-- Data: 21-04-2026
-- Objetivo: Impedir duplicatas no nível do banco de dados usando UPSERT

-- Remover índice anterior (opcional - constraint substitui)
DROP INDEX IF EXISTS idx_transactions_external_id;

-- Adicionar CONSTRAINT UNIQUE (permite múltiplos NULLs - transações manuais)
ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_external_id_key UNIQUE (external_id);

-- Comentário para documentação
COMMENT ON CONSTRAINT transactions_external_id_key ON public.transactions 
  IS 'Constraint para evitar duplicatas em importações OFX. Permite múltiplos NULLs para transações manuais.';
