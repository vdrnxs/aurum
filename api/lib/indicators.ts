import { sma, rsi, macd, bollingerBands, atr, ema, psar, stoch } from 'indicatorts';
import type { Candle } from './hyperliquid.js';

/**
 * Calculates all technical indicators optimized for BTC/USD 4h timeframe
 *
 * Optimizations applied:
 * - SMA: 21 (weekly cycle), 50 (medium trend), 100 (long trend)
 * - EMA: 12 (short, less noise), 21 (weekly), 55 (long, crypto-optimized)
 * - RSI: 14 (standard), 21 (confirmation) - Levels: >75 overbought, <25 oversold
 * - MACD: 8/17/9 (faster for crypto volatility vs traditional 12/26/9)
 * - Bollinger Bands: 20 period, 2 std dev (library default, adequate for most cases)
 * - ATR: 14 (standard) - Use 2x for SL, 3x for TP
 * - Parabolic SAR: step 0.02 (less false reversals), max 0.2
 * - Stochastic: 14/3 (standard) - Levels: >80 overbought, <20 oversold
 */
export function calculateAll(candles: Candle[]) {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  // SMA - Optimized for crypto 4h timeframe
  const sma21Values = sma(closes, { period: 21 });  // Weekly cycle (7 days × 6 candles)
  const sma50Values = sma(closes, { period: 50 });  // Medium trend (~8.3 days)
  const sma100Values = sma(closes, { period: 100 }); // Long trend (~16.6 days)

  // EMA - Reduced sensitivity for 4h candles
  const ema12Values = ema(closes, { period: 12 }); // Short-term (less noise than EMA 9)
  const ema21Values = ema(closes, { period: 21 }); // Weekly trend
  const ema55Values = ema(closes, { period: 55 }); // Long-term (crypto-optimized)

  // RSI - Dual timeframes for confirmation
  const rsi14Values = rsi(closes, { period: 14 }); // Standard
  const rsi21Values = rsi(closes, { period: 21 }); // Less sensitive, better for divergences

  // MACD - Faster settings for crypto volatility
  const macdResult = macd(closes, { fast: 8, slow: 17, signal: 9 });

  // Bollinger Bands - Standard period (library uses stdDev=2 by default)
  // Note: For crypto, ideally we'd use stdDev=2.5, but indicatorts doesn't support this parameter
  const bbResult = bollingerBands(closes, { period: 20 });

  // ATR - Standard period, use multipliers for SL/TP
  const atrResult = atr(highs, lows, closes, { period: 14 });

  // Parabolic SAR - Reduced step to avoid false reversals
  const psarResult = psar(highs, lows, closes, { step: 0.02, max: 0.2 });

  // Stochastic - Standard settings work well for crypto
  const stochResult = stoch(highs, lows, closes, { kPeriod: 14, dPeriod: 3 });

  return {
    sma21: sma21Values,
    sma50: sma50Values,
    sma100: sma100Values,
    ema12: ema12Values,
    ema21: ema21Values,
    ema55: ema55Values,
    rsi14: rsi14Values,
    rsi21: rsi21Values,
    macd: {
      macd: macdResult.macdLine,
      signal: macdResult.signalLine,
      histogram: macdResult.macdLine.map((m, i) => m - macdResult.signalLine[i]),
    },
    bb: bbResult,
    atr: atrResult.atrLine,
    psar: psarResult.psarResult,
    psarTrend: psarResult.trends,
    stoch: stochResult,
  };
}

/**
 * Returns the latest values of all indicators
 * Optimized for BTC/USD 4h trading decisions
 */
export function getLatestValues(candles: Candle[]) {
  const indicators = calculateAll(candles);
  const currentPrice = candles[candles.length - 1].close;

  return {
    price: currentPrice,
    sma: {
      sma21: indicators.sma21[indicators.sma21.length - 1] || 0,
      sma50: indicators.sma50[indicators.sma50.length - 1] || 0,
      sma100: indicators.sma100[indicators.sma100.length - 1] || 0,
    },
    rsi: {
      rsi14: indicators.rsi14[indicators.rsi14.length - 1] || 0,
      rsi21: indicators.rsi21[indicators.rsi21.length - 1] || 0,
    },
    macd: {
      line: indicators.macd.macd[indicators.macd.macd.length - 1] || 0,
      signal: indicators.macd.signal[indicators.macd.signal.length - 1] || 0,
      histogram: indicators.macd.histogram[indicators.macd.histogram.length - 1] || 0,
    },
    bollingerBands: {
      upper: indicators.bb.upper[indicators.bb.upper.length - 1] || 0,
      middle: indicators.bb.middle[indicators.bb.middle.length - 1] || 0,
      lower: indicators.bb.lower[indicators.bb.lower.length - 1] || 0,
    },
    atr: indicators.atr[indicators.atr.length - 1] || 0,
    ema: {
      ema12: indicators.ema12[indicators.ema12.length - 1] || 0,
      ema21: indicators.ema21[indicators.ema21.length - 1] || 0,
      ema55: indicators.ema55[indicators.ema55.length - 1] || 0,
    },
    psar: {
      value: indicators.psar[indicators.psar.length - 1] || 0,
      trend: indicators.psarTrend[indicators.psarTrend.length - 1] || 0,
    },
    stochastic: {
      k: indicators.stoch.k[indicators.stoch.k.length - 1] || 0,
      d: indicators.stoch.d[indicators.stoch.d.length - 1] || 0,
    },
  };
}