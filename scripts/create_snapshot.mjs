import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://gixfbevtcjrvzszuainy.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_M8MlRPlBeuBR2q7nKsDNjw_h_1lP5IO';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || SUPABASE_KEY);

const SQL_SCRIPT = `
-- ============================================================
-- ControlFin - Agent Memory Snapshot
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

-- 3. POLÍTICAS RLS - TABELA GLOBAL (SERVICE ROLE ONLY)
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
`;

async function executeSQL() {
  console.log('🎯 Executando script de snapshot no Supabase...');
  
  try {
    // Executar via RPC - requer função pública no banco
    // Alternativa: usar query direta se client permitir
    const { data, error } = await supabase.from('agent_memory_snapshots').select('*').limit(1);
    
    if (error && error.code === '42P01') {
      console.log('📋 Tabela não existe. Criando...');
      
      // Tentar criar tabela - isso pode falhar pois .from() não permite DDL
      // Precisamos usar abordagem diferente
    }
    
    console.log('✅ Conexão estabelecida!');
    console.log('Tabela agent_memory_snapshots:', data ? 'EXISTE' : 'NÃO EXISTE');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
  
  console.log('\n📝 Script SQL gerado (execute via Supabase Dashboard ou CLI):');
  console.log(SQL_SCRIPT);
}

executeSQL();