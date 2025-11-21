import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

const VALID_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AVAX', 'ARB', 'MATIC', 'DOGE', 'LINK'];
const VALID_INTERVALS = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '8h', '12h', '1d', '3d', '1w', '1M'];

interface HyperliquidCandle {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
}

interface CandleInsert {
  symbol: string;
  interval: string;
  open_time: number;
  close_time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades_count: number;
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('DEBUG - SUPABASE_URL:', url ? 'exists' : 'missing');
  console.log('DEBUG - SUPABASE_SERVICE_ROLE_KEY:', key ? 'exists' : 'missing');

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getIntervalInMs(interval: string): number {
  const map: Record<string, number> = {
    '1m': 60 * 1000,
    '3m': 3 * 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '2h': 2 * 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '8h': 8 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000,
  };
  return map[interval] || 60 * 60 * 1000;
}

function transformCandle(hc: HyperliquidCandle): CandleInsert {
  return {
    symbol: hc.s,
    interval: hc.i,
    open_time: hc.t,
    close_time: hc.T,
    open: parseFloat(hc.o),
    high: parseFloat(hc.h),
    low: parseFloat(hc.l),
    close: parseFloat(hc.c),
    volume: parseFloat(hc.v),
    trades_count: hc.n,
  };
}

async function fetchFromHyperliquid(
  symbol: string,
  interval: string,
  limit: number
): Promise<CandleInsert[]> {
  const intervalMs = getIntervalInMs(interval);
  const endTime = Date.now();
  const startTime = endTime - limit * intervalMs;

  const response = await fetch(HYPERLIQUID_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'candleSnapshot',
      req: { coin: symbol, interval, startTime, endTime },
    }),
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid API error: ${response.status}`);
  }

  const data: HyperliquidCandle[] = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid response from Hyperliquid');
  }

  return data.map(transformCandle);
}

async function saveToSupabase(candles: CandleInsert[]): Promise<void> {
  if (candles.length === 0) return;

  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('candles')
    .upsert(candles, {
      onConflict: 'symbol,interval,open_time',
      ignoreDuplicates: true,
    });

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol, interval, limit = 100 } = req.body;

    // Validacion
    if (!symbol || !interval) {
      return res.status(400).json({ error: 'Missing symbol or interval' });
    }

    if (!VALID_SYMBOLS.includes(symbol)) {
      return res.status(400).json({ error: `Invalid symbol: ${symbol}` });
    }

    if (!VALID_INTERVALS.includes(interval)) {
      return res.status(400).json({ error: `Invalid interval: ${interval}` });
    }

    if (limit < 1 || limit > 500) {
      return res.status(400).json({ error: 'Limit must be between 1 and 500' });
    }

    // Fetch de Hyperliquid y guardar en Supabase
    const candles = await fetchFromHyperliquid(symbol, interval, limit);
    await saveToSupabase(candles);

    return res.status(200).json({
      success: true,
      count: candles.length,
      symbol,
      interval,
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}