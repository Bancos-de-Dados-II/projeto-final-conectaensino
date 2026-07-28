import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Prioriza a chave de serviço para rotas administrativas do backend, com fallback para a key comum
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltam as variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY no arquivo .env');
}

// Cria e exporta a instância do cliente com privilégios administrativos
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});