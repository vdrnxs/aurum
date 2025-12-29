import { encode } from '@toon-format/toon';
import { getLatestValues } from './indicators';
import type { CandleInsert } from '@/types/database';

export function prepareAIPayload(
  candles: CandleInsert[],
  symbol: string,
  interval: string,
  historyLimit: number = 20
): { toonData: string; indicators: ReturnType<typeof getLatestValues> } {
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

  return {
    toonData: encode(payload),
    indicators: latest,
  };
}