import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Candle, CandleInterval, CryptoSymbol } from '../types/database';
import { DataService, type DataServiceOptions, type DataServiceResult } from '../services/dataService';

export interface UseCandlesOptions extends DataServiceOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

export interface UseCandlesResult {
  candles: Candle[] | null;
  loading: boolean;
  error: string | null;
  source: 'cache' | 'api' | null;
  isFresh: boolean;
  timestamp: number | null;
  refetch: () => Promise<void>;
}

export function useCandles(
  symbol: CryptoSymbol,
  interval: CandleInterval,
  limit: number = 100,
  options: UseCandlesOptions = {}
): UseCandlesResult {
  const [candles, setCandles] = useState<Candle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataInfo, setDataInfo] = useState<{
    source: 'cache' | 'api';
    isFresh: boolean;
    timestamp: number;
  } | null>(null);

  const { autoFetch = true, refreshInterval, ...dataServiceOptions } = options;

  const optionsKey = useMemo(
    () => JSON.stringify(dataServiceOptions),
    [dataServiceOptions.source, dataServiceOptions.forceRefresh, dataServiceOptions.maxCacheAgeMs]
  );

  const fetchCandles = useCallback(async () => {
    console.log('🔵 useCandles: Starting fetch...', { symbol, interval, limit });
    try {
      setLoading(true);
      setError(null);

      console.log('🔵 useCandles: Calling DataService.getCandles...');
      const result: DataServiceResult = await DataService.getCandles(
        symbol,
        interval,
        limit,
        dataServiceOptions
      );

      console.log('✅ useCandles: Got result', {
        candlesCount: result.candles.length,
        source: result.source,
        isFresh: result.isFresh,
      });

      setCandles(result.candles);
      setDataInfo({
        source: result.source,
        isFresh: result.isFresh,
        timestamp: result.timestamp,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error loading candles';
      setError(errorMessage);
      console.error('❌ useCandles ERROR:', err);
      console.error('❌ Error details:', errorMessage);
    } finally {
      console.log('🔵 useCandles: Setting loading to false');
      setLoading(false);
    }
  }, [symbol, interval, limit, optionsKey]);

  useEffect(() => {
    if (autoFetch) {
      fetchCandles();
    }
  }, [autoFetch, fetchCandles]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchCandles();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, fetchCandles]);

  return {
    candles,
    loading,
    error,
    source: dataInfo?.source || null,
    isFresh: dataInfo?.isFresh || false,
    timestamp: dataInfo?.timestamp || null,
    refetch: fetchCandles,
  };
}