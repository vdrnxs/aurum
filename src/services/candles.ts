import { buildCandlesQuery } from '../utils/query-builder';
import { isNoDataError, handleSupabaseError } from '../utils/supabase-error';
import type { Candle, CandleInterval, CryptoSymbol } from '../types/database';

const DEFAULT_LIMIT = 100;

export async function getLatestCandles(
  symbol: CryptoSymbol,
  interval: CandleInterval,
  limit: number = DEFAULT_LIMIT
): Promise<Candle[]> {
  console.log(`[getLatestCandles] Fetching ${symbol} ${interval}, limit: ${limit}`);

  const { data, error } = await buildCandlesQuery({ symbol, interval })
    .order('open_time', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getLatestCandles] Supabase error:', error);
    handleSupabaseError(error, 'getLatestCandles');
  }

  console.log(`[getLatestCandles] Retrieved ${data?.length || 0} candles`);
  return (data || []).reverse();
}

export async function getLatestCandle(
  symbol: CryptoSymbol,
  interval: CandleInterval
): Promise<Candle | null> {
  console.log(`[getLatestCandle] Checking latest candle for ${symbol} ${interval}`);

  const { data, error } = await buildCandlesQuery({ symbol, interval })
    .order('open_time', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (isNoDataError(error)) {
      console.log(`[getLatestCandle] No data found for ${symbol} ${interval}`);
      return null;
    }
    console.error('[getLatestCandle] Supabase error:', error);
    handleSupabaseError(error, 'getLatestCandle');
  }

  console.log(`[getLatestCandle] Found candle:`, data?.open_time);
  return data;
}