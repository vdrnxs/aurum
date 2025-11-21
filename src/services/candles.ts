import { buildCandlesQuery } from '../utils/query-builder';
import { isNoDataError, handleSupabaseError } from '../utils/supabase-error';
import type { Candle, CandleInterval, CryptoSymbol } from '../types/database';

const DEFAULT_LIMIT = 100;

export async function getLatestCandles(
  symbol: CryptoSymbol,
  interval: CandleInterval,
  limit: number = DEFAULT_LIMIT
): Promise<Candle[]> {
  const { data, error } = await buildCandlesQuery({ symbol, interval })
    .order('open_time', { ascending: false })
    .limit(limit);

  if (error) {
    handleSupabaseError(error, 'getLatestCandles');
  }

  return (data || []).reverse();
}

export async function getLatestCandle(
  symbol: CryptoSymbol,
  interval: CandleInterval
): Promise<Candle | null> {
  const { data, error } = await buildCandlesQuery({ symbol, interval })
    .order('open_time', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (isNoDataError(error)) {
      return null;
    }
    handleSupabaseError(error, 'getLatestCandle');
  }

  return data;
}