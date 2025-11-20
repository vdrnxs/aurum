import { supabase } from '../lib/supabase';
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

export async function saveCandles(candles: Candle[]): Promise<void> {
  if (candles.length === 0) return;

  const candlesToInsert = candles.map((candle) => ({
    symbol: candle.symbol,
    interval: candle.interval,
    open_time: candle.open_time,
    close_time: candle.close_time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    trades_count: candle.trades_count,
  }));

  const { error } = await supabase
    .from('candles')
    .upsert(candlesToInsert, {
      onConflict: 'symbol,interval,open_time',
      ignoreDuplicates: true,
    });

  if (error) {
    handleSupabaseError(error, 'saveCandles');
  }
}
