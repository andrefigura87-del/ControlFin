-- ============================================================
-- ControlFin - Agent Memory Snapshot
-- Migration: Criar tabela de memória do agente
-- Data: 2026-04-22
-- ============================================================

-- 1. CRIAÇÃO DA TABELA
CREATE TABLE IF NOT EXISTS public.agent_memory_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version VARCHAR(20) NOT NULL DEFAULT 'v5.5',
    raw_context TEXT NOT NULL,
    indexed_knowledge JSONB NOT NULL
);

-- 2. ÍNDICE GIN PARA BUSCAS RÁPIDAS NO JSONB
CREATE INDEX IF NOT EXISTS idx_agent_memory_snapshots_knowledge_gin 
ON public.agent_memory_snapshots 
USING GIN (indexed_knowledge);

-- 3. POLÍTICAS RLS - ACESSO SERVICE ROLE ONLY
ALTER TABLE public.agent_memory_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Service Role" ON public.agent_memory_snapshots;
CREATE POLICY "Allow Service Role" ON public.agent_memory_snapshots 
FOR ALL USING (auth.role() = 'service_role');

-- 4. INSERT DO CONHECIMENTO ARQUITETURAL
INSERT INTO public.agent_memory_snapshots (version, raw_context, indexed_knowledge) VALUES (
    'v5.5',
    'ControlFin v5.5 - Sistema de Controle Financeiro Cloud-Native. Stack: React 19 + Vite + TailwindCSS v4 + Supabase. Regras de negócio críticas: - todayISO para filtro temporal global (transações futuras não afetam saldo) - groupId para recorrências (parcelas compartilhadas, edições em lote) - external_id para deduplicação OFX (UNIQUE constraint permite NULLs múltiplos) - Soft delete com deleted_at - RLS com user_id = auth.uid() - Partidas dobradas: Reservas/Transferências sem categoria, badge visual',
    '{
        "database_rules": {
            "external_id_unique": true,
            "allows_null_duplicates": true,
            "soft_delete_column": "deleted_at",
            "rls_policy": "user_id = auth.uid()",
            "ofx_import_strategy": "upsert on_conflict external_id ignoreDuplicates"
        },
        "ui_ux_patterns": {
            "icons": "lucide-react",
            "styling": "tailwindcss-v4",
            "volumetric_icon": "3D gradient icons",
            "category_dropdown": "anti-loop with loading state",
            "charts": "recharts"
        },
        "business_logic": {
            "today_iso": "filtro mês corrente - futuras não afetam saldo",
            "group_id": "recorrências parceladas/edição em lote",
            "double_entry": "reservas/transferências sem categoria",
            "import_detection": "keywords para detectar transferência via OFX"
        },
        "current_stack": {
            "frontend": "react-19 vite tailwindcss-v4",
            "backend": "supabase postgresql rls",
            "icons": "lucide-react volumetricicon",
            "charts": "recharts",
            "build": "vite-pwa vercel"
        }
    }'::JSONB
);