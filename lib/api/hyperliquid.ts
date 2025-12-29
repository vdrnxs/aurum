import { z } from 'zod';
import { createLogger } from './logger';
import type { CandleInsert } from '@/types/database';

const log = createLogger('hyperliquid');

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

// Zod schema for runtime validation of Hyperliquid API responses
const HyperliquidCandleSchema = z.object({
  t: z.number().int().positive('open_time must be a positive integer'),
  T: z.number().int().positive('close_time must be a positive integer'),
  s: z.string().min(1, 'symbol cannot be empty'),
  i: z.string().min(1, 'interval cannot be empty'),
  o: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'open must be a valid positive number string',
  }),
  c: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'close must be a valid positive number string',
  }),
  h: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'high must be a valid positive number string',
  }),
  l: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'low must be a valid positive number string',
  }),
  v: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'volume must be a valid non-negative number string',
  }),
  n: z.number().int().nonnegative('trades_count must be a non-negative integer'),
});

const HyperliquidResponseSchema = z.array(HyperliquidCandleSchema);

export async function fetchCandles(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<CandleInsert[]> {
  const intervalMs = getIntervalInMs(interval);
  const endTime = Date.now();
  const startTime = endTime - limit * intervalMs;

  const response = await fetch(HYPERLIQUID_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'candleSnapshot',
      req: {
        coin: symbol,
        interval,
        startTime,
        endTime,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Hyperliquid API error: ${response.status}`);
  }

  const rawData = await response.json();

  // Validate response with Zod (runtime type safety)
  const parseResult = HyperliquidResponseSchema.safeParse(rawData);

  if (!parseResult.success) {
    const errors = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Invalid Hyperliquid API response format: ${errors}`);
  }

  const data = parseResult.data;

  // Additional validation: ensure we got some candles
  if (data.length === 0) {
    log.warn('API returned empty array - no candles available', { symbol, interval, limit });
  }

  return data.map((hc) => ({
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
  }));
}

function getIntervalInMs(interval: string): number {
  const map: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };
  return map[interval] || 60 * 60 * 1000;
}