import { useMemo } from 'react';
import type { Candle } from '../types/database';
import { IndicatorService } from '../services/indicators';

export function useIndicators(candles: Candle[] | null) {
  const indicators = useMemo(() => {
    if (!candles || candles.length < 50) {
      return null;
    }

    return IndicatorService.calculateAll(candles);
  }, [candles]);

  return indicators;
}

export function useLatestIndicators(candles: Candle[] | null) {
  return useMemo(() => {
    if (!candles || candles.length < 50) {
      return null;
    }

    return IndicatorService.getLatestValues(candles);
  }, [candles]);
}

export function useSMA(candles: Candle[] | null, period: number = 20) {
  return useMemo(() => {
    if (!candles || candles.length < period) {
      return null;
    }
    return IndicatorService.calculateSMA(candles, period);
  }, [candles, period]);
}

export function useRSI(candles: Candle[] | null, period: number = 14) {
  return useMemo(() => {
    if (!candles || candles.length < period + 1) {
      return null;
    }
    return IndicatorService.calculateRSI(candles, period);
  }, [candles, period]);
}

export function useMACD(
  candles: Candle[] | null,
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
) {
  return useMemo(() => {
    if (!candles || candles.length < slowPeriod) {
      return null;
    }
    return IndicatorService.calculateMACD(
      candles,
      fastPeriod,
      slowPeriod,
      signalPeriod
    );
  }, [candles, fastPeriod, slowPeriod, signalPeriod]);
}