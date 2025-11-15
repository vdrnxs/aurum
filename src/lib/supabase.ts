// Cliente de Supabase para el frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno existan
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

/**
 * Cliente de Supabase para el frontend
 * Solo tiene permisos de LECTURA (anon key)
 * NO puede insertar, actualizar o borrar datos
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
