import { useMemo } from 'react';
import type { Candle } from '../types/database';
import { IndicatorService } from '../services/indicators';

/**
 * Calculate all indicators and return latest values
 * Used for AI analysis and simple data display
 */
export function useLatestIndicators(candles: Candle[] | null) {
  return useMemo(() => {
    if (!candles || candles.length < 50) {
      return null;
    }

    return IndicatorService.getLatestValues(candles);
  }, [candles]);
}

/**
 * Calculate all indicators with full time series
 * Useful for charting and detailed analysis
 */
export function useIndicators(candles: Candle[] | null) {
  const indicators = useMemo(() => {
    if (!candles || candles.length < 50) {
      return null;
    }

    return IndicatorService.calculateAll(candles);
  }, [candles]);

  return indicators;
}