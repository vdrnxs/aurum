import { supabase } from '../lib/supabase';
import type { CandleInterval, CryptoSymbol } from '../types/database';

interface CandleQueryParams {
  symbol: CryptoSymbol;
  interval: CandleInterval;
}

export function buildCandlesQuery(params: CandleQueryParams) {
  return supabase
    .from('candles')
    .select('*')
    .eq('symbol', params.symbol)
    .eq('interval', params.interval);
}
