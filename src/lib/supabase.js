import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Tamanho da Chave:", supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar no .env!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


