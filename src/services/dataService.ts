import type { Candle, CandleInterval, CryptoSymbol } from '../types/database';
import { getLatestCandles, getLatestCandle } from './candles';
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

async function refreshCache(
  symbol: CryptoSymbol,
  interval: CandleInterval,
  limit: number
): Promise<void> {
  const response = await fetch('/api/candles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, interval, limit }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refresh cache');
  }
}

export class DataService {
  private static readonly DEFAULT_CACHE_AGE = 1 * 60 * 60 * 1000; // 1 hour
  private static readonly MIN_CANDLES_THRESHOLD = 50; // Mínimo de candles requeridas

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

    // Verificar si tenemos datos en cache
    const latestCandle = await getLatestCandle(symbol, interval);

    if (!latestCandle) {
      console.log(
        `[DataService] No cached data for ${symbol} ${interval}, fetching from API...`
      );
      return await this.fetchFromAPI(symbol, interval, limit);
    }

    // Obtener todos los candles en cache para verificar cantidad
    const cachedCandles = await getLatestCandles(symbol, interval, limit);
    const cachedCount = cachedCandles.length;

    console.log(
      `[DataService] Cache has ${cachedCount}/${limit} candles for ${symbol} ${interval}`
    );

    // Verificar si la última candle es reciente
    const isFresh = HyperliquidService.isFreshData(latestCandle, maxCacheAgeMs);
    const cacheAge = Math.round(
      (Date.now() - new Date(latestCandle.created_at).getTime()) / 1000 / 60
    );

    // Decidir si necesitamos refrescar
    const needsRefresh = !isFresh || cachedCount < this.MIN_CANDLES_THRESHOLD;

    if (needsRefresh) {
      if (!isFresh) {
        console.log(
          `[DataService] Cache is stale (${cacheAge} min old), fetching from API...`
        );
      } else {
        console.log(
          `[DataService] Cache is fresh but insufficient (${cachedCount}/${this.MIN_CANDLES_THRESHOLD}), fetching from API...`
        );
      }
      return await this.fetchFromAPI(symbol, interval, limit);
    }

    // Cache es fresco y suficiente
    console.log(
      `[DataService] Using cached data for ${symbol} ${interval} (cached ${cacheAge} min ago, ${cachedCount} candles)`
    );
    return {
      candles: cachedCandles,
      source: 'cache',
      timestamp: latestCandle.open_time,
      isFresh: true,
    };
  }

  private static async fetchFromAPI(
    symbol: CryptoSymbol,
    interval: CandleInterval,
    limit: number
  ): Promise<DataServiceResult> {
    try {
      // Llama al backend serverless para refrescar cache
      await refreshCache(symbol, interval, limit);
      console.log(`Refreshed cache via API for ${symbol} ${interval}`);

      // Lee los datos actualizados de Supabase
      const candles = await getLatestCandles(symbol, interval, limit);

      return {
        candles,
        source: 'api',
        timestamp: Date.now(),
        isFresh: true,
      };
    } catch (error) {
      console.error('Error refreshing cache:', error);

      // Fallback: leer directo de Hyperliquid (sin guardar)
      console.log('Falling back to direct Hyperliquid API...');
      try {
        const candles = await HyperliquidService.getCandles(
          symbol,
          interval,
          limit
        );
        return {
          candles,
          source: 'api',
          timestamp: Date.now(),
          isFresh: true,
        };
      } catch (fallbackError) {
        // Ultimo recurso: cache viejo
        console.log('Falling back to stale cache...');
        const cachedCandles = await getLatestCandles(symbol, interval, limit);

        if (cachedCandles.length === 0) {
          throw new Error(
            `No data available: ${
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
}