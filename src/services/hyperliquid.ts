import type { Candle, CandleInterval, CryptoSymbol } from '../types/database';
import type { HyperliquidCandle } from '../types/database';

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

export class HyperliquidService {
  static async getCandles(
    symbol: CryptoSymbol,
    interval: CandleInterval,
    limit: number = 100
  ): Promise<Candle[]> {
    try {
      const intervalMs = this.getIntervalInMs(interval);
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
        throw new Error(
          `Hyperliquid API error: ${response.status} ${response.statusText}`
        );
      }

      const data: HyperliquidCandle[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from Hyperliquid API');
      }

      return data.map((candle) => this.convertToCandle(candle));
    } catch (error) {
      console.error('Error fetching from Hyperliquid:', error);
      throw new Error(
        `Failed to fetch candles from Hyperliquid: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  private static convertToCandle(hc: HyperliquidCandle): Candle {
    return {
      id: 0,
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
      created_at: new Date().toISOString(),
    };
  }

  private static getIntervalInMs(interval: CandleInterval): number {
    const map: Record<CandleInterval, number> = {
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

  static isFreshData(candle: Candle, maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    const now = Date.now();
    const createdAt = new Date(candle.created_at).getTime();
    const age = now - createdAt;
    return age < maxAgeMs;
  }

  static isToday(timestamp: number): boolean {
    const now = new Date();
    const date = new Date(timestamp);

    return (
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate()
    );
  }
}