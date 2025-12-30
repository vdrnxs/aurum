import { supabase } from '@/lib/supabase/client'
import { TradingSignal } from '@/types/database'

export async function getLatestSignal(
  symbol: string = 'BTC',
  interval: string = '4h'
): Promise<TradingSignal | null> {
  const { data, error } = await supabase
    .from('btc_trading_signals')
    .select('*')
    .eq('symbol', symbol)
    .eq('interval', interval)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching latest signal:', error)
    return null
  }

  return data as TradingSignal
}

export async function getSignalHistory(
  symbol: string = 'BTC',
  interval: string = '4h',
  limit: number = 20
): Promise<TradingSignal[]> {
  const { data, error } = await supabase
    .from('btc_trading_signals')
    .select('*')
    .eq('symbol', symbol)
    .eq('interval', interval)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching signal history:', error)
    return []
  }

  return (data as TradingSignal[]) || []
}

export async function getSignalStats(
  symbol: string = 'BTC',
  interval: string = '4h'
) {
  const { data, error } = await supabase
    .from('btc_trading_signals')
    .select('signal')
    .eq('symbol', symbol)
    .eq('interval', interval)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching signal stats:', error)
    return {
      totalSignals: 0,
      buySignals: 0,
      sellSignals: 0,
    }
  }

  const signals = data || []
  const buySignals = signals.filter(
    (s) => s.signal === 'BUY' || s.signal === 'STRONG_BUY'
  ).length
  const sellSignals = signals.filter(
    (s) => s.signal === 'SELL' || s.signal === 'STRONG_SELL'
  ).length

  return {
    totalSignals: signals.length,
    buySignals,
    sellSignals,
  }
}