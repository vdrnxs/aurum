import { PostgrestError } from '@supabase/supabase-js';

const ERROR_CODES = {
  NO_DATA: 'PGRST116',
} as const;

export function isNoDataError(error: PostgrestError): boolean {
  return error.code === ERROR_CODES.NO_DATA;
}

export function handleSupabaseError(error: PostgrestError, context: string): never {
  console.error(`Supabase error in ${context}:`, error);
  throw error;
}
