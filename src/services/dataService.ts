import type { Candle, CandleInterval, CryptoSymbol } from '../types/database';
import { getLatestCandles, getLatestCandle, saveCandles } from './candles';
import { HyperliquidService } from './hyperliquid';

export interface DataServiceOptions {
  maxCacheAgeMs?: number;
  forceRefresh?: boolean;
  source?: 'cache' | 'api' | 'auto';
}

export interface DataServiceResult {
  candles: Candle[];
  source: 'cache' | 'api';
  timestamp: number;
  isFresh: boolean;
}

export class DataService {
  private static readonly DEFAULT_CACHE_AGE = 1 * 60 * 60 * 1000; // 1 hour (aligned with 24h cleanup)

  static async getCandles(
    symbol: CryptoSymbol,
    interval: CandleInterval,
    limit: number = 100,
    options: DataServiceOptions = {}
  ): Promise<DataServiceResult> {
    const {
      maxCacheAgeMs = this.DEFAULT_CACHE_AGE,
      forceRefresh = false,
      source = 'auto',
    } = options;

    if (source === 'api' || forceRefresh) {
      return await this.fetchFromAPI(symbol, interval, limit);
    }

    if (source === 'cache') {
      const cachedCandles = await getLatestCandles(symbol, interval, limit);
      return {
        candles: cachedCandles,
        source: 'cache',
        timestamp: Date.now(),
        isFresh: cachedCandles.length > 0,
      };
    }

    const latestCandle = await getLatestCandle(symbol, interval);

    if (!latestCandle) {
      console.log(
        `No cached data for ${symbol} ${interval}, fetching from API...`
      );
      return await this.fetchFromAPI(symbol, interval, limit);
    }

    const isFresh = HyperliquidService.isFreshData(latestCandle, maxCacheAgeMs);

    if (isFresh) {
      console.log(
        `Using cached data for ${symbol} ${interval} (${new Date(
          latestCandle.open_time
        ).toLocaleString()})`
      );
      const cachedCandles = await getLatestCandles(symbol, interval, limit);
      return {
        candles: cachedCandles,
        source: 'cache',
        timestamp: latestCandle.open_time,
        isFresh: true,
      };
    }

    console.log(
      `Cached data for ${symbol} ${interval} is stale, fetching from API...`
    );
    return await this.fetchFromAPI(symbol, interval, limit);
  }

  private static async fetchFromAPI(
    symbol: CryptoSymbol,
    interval: CandleInterval,
    limit: number
  ): Promise<DataServiceResult> {
    try {
      const candles = await HyperliquidService.getCandles(
        symbol,
        interval,
        limit
      );

      console.log(
        `Fetched ${candles.length} candles from Hyperliquid API for ${symbol} ${interval}`
      );

      await saveCandles(candles);
      console.log(`Saved ${candles.length} candles to cache`);

      return {
        candles,
        source: 'api',
        timestamp: Date.now(),
        isFresh: true,
      };
    } catch (error) {
      console.error('Error fetching from Hyperliquid API:', error);

      console.log('Falling back to cached data...');
      const cachedCandles = await getLatestCandles(symbol, interval, limit);

      if (cachedCandles.length === 0) {
        throw new Error(
          `No cached data available and API failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }

      return {
        candles: cachedCandles,
        source: 'cache',
        timestamp:
          cachedCandles[cachedCandles.length - 1]?.open_time || Date.now(),
        isFresh: false,
      };
    }
  }

}