import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config.js';
import type { CandleInsert } from './types.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseClient;
}

export async function upsertCandle(candle: CandleInsert): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('candles')
    .upsert(candle, {
      onConflict: 'symbol,interval,open_time',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error(`Error upserting candle for ${candle.symbol}:`, error);
    throw error;
  }
}
