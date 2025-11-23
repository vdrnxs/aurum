import { supabase } from '../lib/supabase';
import type { TradingSignal } from '../types/database';

export async function getLatestSignal(
  symbol: string = 'BTC',
  interval: string = '4h'
): Promise<TradingSignal | null> {
  console.log(`[getLatestSignal] Fetching latest signal for ${symbol} ${interval}`);

  const { data, error } = await supabase
    .from('btc_trading_signals')
    .select('*')
    .eq('symbol', symbol)
    .eq('interval', interval)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[getLatestSignal] Error:', error);
    throw error;
  }

  console.log('[getLatestSignal] Result:', data ? 'Found signal' : 'No signals');
  return data;
}

export async function getSignalHistory(
  symbol: string = 'BTC',
  interval: string = '4h',
  limit: number = 10
): Promise<TradingSignal[]> {
  console.log(`[getSignalHistory] Fetching ${limit} signals for ${symbol} ${interval}`);

  const { data, error } = await supabase
    .from('btc_trading_signals')
    .select('*')
    .eq('symbol', symbol)
    .eq('interval', interval)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getSignalHistory] Error:', error);
    throw error;
  }

  console.log(`[getSignalHistory] Retrieved ${data?.length || 0} signals`);
  return data || [];
}
