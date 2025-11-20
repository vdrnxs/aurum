import { useMemo } from 'react';
import type { Candle } from '../types/database';
import { IndicatorService } from '../services/indicators';

export function useIndicators(candles: Candle[] | null) {
  const indicators = useMemo(() => {
    if (!candles || candles.length === 0) {
      return null;
    }

    return IndicatorService.calculateMultipleIndicators(candles);
  }, [candles]);

  return indicators;
}

export function useSMA(candles: Candle[] | null, period: number = 20) {
  return useMemo(() => {
    if (!candles || candles.length < period) {
      return null;
    }
    return IndicatorService.calculateSMA(candles, period);
  }, [candles, period]);
}

export function useEMA(candles: Candle[] | null, period: number = 20) {
  return useMemo(() => {
    if (!candles || candles.length < period) {
      return null;
    }
    return IndicatorService.calculateEMA(candles, period);
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

export function useBollingerBands(
  candles: Candle[] | null,
  period: number = 20
) {
  return useMemo(() => {
    if (!candles || candles.length < period) {
      return null;
    }
    return IndicatorService.calculateBollingerBands(candles, period);
  }, [candles, period]);
}

export function useATR(candles: Candle[] | null, period: number = 14) {
  return useMemo(() => {
    if (!candles || candles.length < period + 1) {
      return null;
    }
    return IndicatorService.calculateATR(candles, period);
  }, [candles, period]);
}