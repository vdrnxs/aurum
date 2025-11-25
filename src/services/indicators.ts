import { supabase } from '../lib/supabase';

export interface IndicatorData {
  signal_id: number;
  created_at: string;
  price: number;
  sma_21: number;
  sma_50: number;
  sma_100: number;
  ema_12: number;
  ema_21: number;
  ema_55: number;
  rsi_14: number;
  rsi_21: number;
  macd_line: number;
  macd_signal: number;
  macd_histogram: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  atr: number;
  psar_value: number;
  psar_trend: number;
  stoch_k: number;
  stoch_d: number;
}

/**
 * Get indicators for the latest signal
 */
export async function getLatestIndicators(interval: string = '4h'): Promise<IndicatorData | null> {
  const { data: latestSignal, error: signalError } = await supabase
    .from('btc_trading_signals')
    .select('id')
    .eq('interval', interval)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (signalError || !latestSignal) {
    console.error('Error fetching latest signal:', signalError);
    return null;
  }

  const { data, error } = await supabase
    .from('btc_indicators')
    .select('*')
    .eq('signal_id', latestSignal.id)
    .single();

  if (error) {
    console.error('Error fetching indicators:', error);
    return null;
  }

  return data;
}

/**
 * Get indicators for a specific signal ID
 */
export async function getIndicatorsBySignalId(signalId: number): Promise<IndicatorData | null> {
  const { data, error } = await supabase
    .from('btc_indicators')
    .select('*')
    .eq('signal_id', signalId)
    .single();

  if (error) {
    console.error('Error fetching indicators:', error);
    return null;
  }

  return data;
}

/**
 * Get indicators history with their signals
 */
export async function getIndicatorsHistory(interval: string = '4h', limit: number = 10) {
  const { data, error } = await supabase
    .from('btc_trading_signals')
    .select(`
      id,
      created_at,
      signal,
      confidence,
      btc_indicators (*)
    `)
    .eq('interval', interval)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching indicators history:', error);
    return [];
  }

  return data;
}
