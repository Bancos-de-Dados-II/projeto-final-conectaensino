import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Garante que as variáveis do .env sejam carregadas (caso o server.ts já não faça isso globalmente)
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltam as variáveis SUPABASE_URL ou SUPABASE_KEY no arquivo .env');
}

// Cria e exporta a instância do cliente
export const supabase = createClient(supabaseUrl, supabaseKey);