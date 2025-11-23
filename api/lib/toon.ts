import { encode } from '@toon-format/toon';
import { getLatestValues } from './indicators.js';
import type { Candle } from './hyperliquid.js';

export function prepareAIPayload(
  candles: Candle[],
  symbol: string,
  interval: string,
  historyLimit: number = 20
): string {
  const latest = getLatestValues(candles);
  const recentCandles = candles.slice(-historyLimit);

  const payload = {
    metadata: {
      symbol,
      interval,
      timestamp: Date.now(),
      candleCount: candles.length,
      historyDepth: historyLimit,
    },
    current: latest,
    recentHistory: {
      prices: recentCandles.map((c) => ({
        timestamp: c.open_time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      })),
    },
  };

  return encode(payload);
}