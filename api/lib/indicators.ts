import { sma, rsi, macd, bollingerBands, atr, ema, psar, stoch } from 'indicatorts';
import type { Candle } from './hyperliquid.js';

export function calculateAll(candles: Candle[]) {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const sma20Values = sma(closes, { period: 20 });
  const sma50Values = sma(closes, { period: 50 });
  const ema9Values = ema(closes, { period: 9 });
  const ema21Values = ema(closes, { period: 21 });
  const ema50Values = ema(closes, { period: 50 });
  const rsi14Values = rsi(closes, { period: 14 });
  const macdResult = macd(closes, { fast: 12, slow: 26, signal: 9 });
  const bbResult = bollingerBands(closes, { period: 20 });
  const atrResult = atr(highs, lows, closes, { period: 14 });
  const psarResult = psar(highs, lows, closes, { step: 0.03, max: 0.2 });
  const stochResult = stoch(highs, lows, closes, { kPeriod: 14, dPeriod: 3 });

  return {
    sma20: sma20Values,
    sma50: sma50Values,
    ema9: ema9Values,
    ema21: ema21Values,
    ema50: ema50Values,
    rsi14: rsi14Values,
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

export function getLatestValues(candles: Candle[]) {
  const indicators = calculateAll(candles);
  const currentPrice = candles[candles.length - 1].close;

  return {
    price: currentPrice,
    sma: {
      sma20: indicators.sma20[indicators.sma20.length - 1] || 0,
      sma50: indicators.sma50[indicators.sma50.length - 1] || 0,
    },
    rsi: indicators.rsi14[indicators.rsi14.length - 1] || 0,
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
      ema9: indicators.ema9[indicators.ema9.length - 1] || 0,
      ema21: indicators.ema21[indicators.ema21.length - 1] || 0,
      ema50: indicators.ema50[indicators.ema50.length - 1] || 0,
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