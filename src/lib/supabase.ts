// Cliente de Supabase para el frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log environment variables (solo en desarrollo)
console.log('[Supabase Client] Initializing...');
console.log('[Supabase Client] URL:', supabaseUrl);
console.log('[Supabase Client] Key exists:', !!supabaseAnonKey);
console.log('[Supabase Client] Key preview:', supabaseAnonKey?.substring(0, 20) + '...');

// Validar que las variables de entorno existan
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase Client] Missing environment variables!');
  console.error('[Supabase Client] URL:', supabaseUrl);
  console.error('[Supabase Client] Key:', supabaseAnonKey ? 'exists' : 'missing');
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

console.log('[Supabase Client] Initialized successfully');
