-- ControlFin - Migration: Adicionar campo external_id para deduplicação OFX
-- Data: 21-04-2026
-- Objetivo: Permitir controle de transações importadas para evitar duplicatas

-- Adicionar coluna external_id (FITID do OFX)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Criar índice para busca rápida de duplicatas
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON public.transactions(external_id);

-- Comentário para documentação
COMMENT ON COLUMN public.transactions.external_id IS 'ID único externo (FITID do OFX) para controle de duplicatas em importações';
