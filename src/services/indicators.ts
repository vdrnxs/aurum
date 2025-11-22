import { sma, rsi, macd, bollingerBands, atr, ema, psar, stoch } from 'indicatorts';
import type { Candle } from '../types/database';
import type { SMAResult, RSIResult, MACDResult, BollingerBandsResult, ATRResult, EMAResult, PSARResult, StochResult } from '../types/indicators';

export class IndicatorService {
  static calculateSMA(candles: Candle[], period: number = 20): SMAResult[] {
    const closes = candles.map((c) => c.close);
    const smaValues = sma(closes, { period });

    return smaValues.map((value, index) => ({
      timestamp: candles[index + period - 1]?.open_time || 0,
      value,
      period,
    }));
  }

  static calculateRSI(candles: Candle[], period: number = 14): RSIResult[] {
    const closes = candles.map((c) => c.close);
    const rsiValues = rsi(closes, { period });

    return rsiValues.map((value, index) => ({
      timestamp: candles[index + period]?.open_time || 0,
      value,
      period,
    }));
  }

  static calculateMACD(
    candles: Candle[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): MACDResult[] {
    const closes = candles.map((c) => c.close);
    const macdResult = macd(closes, {
      fast: fastPeriod,
      slow: slowPeriod,
      signal: signalPeriod,
    });

    const macdLine = macdResult.macdLine;
    const signalLine = macdResult.signalLine;

    return macdLine.map((macdValue, index) => ({
      timestamp: candles[index + slowPeriod - 1]?.open_time || 0,
      macd: macdValue,
      signal: signalLine[index],
      histogram: macdValue - signalLine[index],
    }));
  }

  static calculateBollingerBands(
    candles: Candle[],
    period: number = 20
  ): BollingerBandsResult[] {
    const closes = candles.map((c) => c.close);
    const bb = bollingerBands(closes, { period });

    return bb.middle.map((middle: number, index: number) => ({
      timestamp: candles[index + period - 1]?.open_time || 0,
      upper: bb.upper[index],
      middle,
      lower: bb.lower[index],
    }));
  }

  static calculateATR(candles: Candle[], period: number = 14): ATRResult[] {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const closes = candles.map((c) => c.close);
    const atrResult = atr(highs, lows, closes, { period });

    return atrResult.atrLine.map((value: number, index: number) => ({
      timestamp: candles[index + period - 1]?.open_time || 0,
      value,
      period,
    }));
  }

  static calculateEMA(candles: Candle[], period: number = 20): EMAResult[] {
    const closes = candles.map((c) => c.close);
    const emaValues = ema(closes, { period });

    return emaValues.map((value, index) => ({
      timestamp: candles[index + period - 1]?.open_time || 0,
      value,
      period,
    }));
  }

  /**
   * Parabolic SAR - Trailing stop and reversal indicator
   *
   * @param candles - Array of candle data
   * @param step - Acceleration factor increment (default: 0.02 for stocks, 0.03 for crypto)
   * @param max - Maximum acceleration factor (default: 0.2)
   *
   * Higher step = More sensitive to price changes (faster reversals)
   * For crypto 1h: 0.03-0.04 recommended for better responsiveness
   */
  static calculatePSAR(candles: Candle[], step: number = 0.02, max: number = 0.2): PSARResult[] {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const closes = candles.map((c) => c.close);
    const psarResult = psar(highs, lows, closes, { step, max });

    return psarResult.psarResult.map((value, index) => ({
      timestamp: candles[index]?.open_time || 0,
      value,
      trend: psarResult.trends[index],
    }));
  }

  static calculateStochastic(candles: Candle[], kPeriod: number = 14, dPeriod: number = 3): StochResult[] {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const closes = candles.map((c) => c.close);
    const stochResult = stoch(highs, lows, closes, { kPeriod, dPeriod });

    return stochResult.k.map((kValue, index) => ({
      timestamp: candles[index + kPeriod - 1]?.open_time || 0,
      k: kValue,
      d: stochResult.d[index],
    }));
  }

  static calculateAll(candles: Candle[]) {
    return {
      sma20: this.calculateSMA(candles, 20),
      sma50: this.calculateSMA(candles, 50),
      rsi14: this.calculateRSI(candles, 14),
      macd: this.calculateMACD(candles, 12, 26, 9),
      bollingerBands: this.calculateBollingerBands(candles, 20),
      atr14: this.calculateATR(candles, 14),
      ema9: this.calculateEMA(candles, 9),
      ema21: this.calculateEMA(candles, 21),
      ema50: this.calculateEMA(candles, 50),
      psar: this.calculatePSAR(candles, 0.03, 0.2),
      stochastic: this.calculateStochastic(candles, 14, 3),
    };
  }

  static getLatestValues(candles: Candle[]) {
    const indicators = this.calculateAll(candles);
    const currentPrice = candles[candles.length - 1].close;
    const latestBB = indicators.bollingerBands[indicators.bollingerBands.length - 1];
    const latestATR = indicators.atr14[indicators.atr14.length - 1];
    const latestPSAR = indicators.psar[indicators.psar.length - 1];
    const latestStoch = indicators.stochastic[indicators.stochastic.length - 1];

    return {
      price: currentPrice,
      sma: {
        sma20: indicators.sma20[indicators.sma20.length - 1]?.value || 0,
        sma50: indicators.sma50[indicators.sma50.length - 1]?.value || 0,
      },
      rsi: indicators.rsi14[indicators.rsi14.length - 1]?.value || 0,
      macd: {
        line: indicators.macd[indicators.macd.length - 1]?.macd || 0,
        signal: indicators.macd[indicators.macd.length - 1]?.signal || 0,
        histogram: indicators.macd[indicators.macd.length - 1]?.histogram || 0,
      },
      bollingerBands: {
        upper: latestBB?.upper || 0,
        middle: latestBB?.middle || 0,
        lower: latestBB?.lower || 0,
      },
      atr: latestATR?.value || 0,
      ema: {
        ema9: indicators.ema9[indicators.ema9.length - 1]?.value || 0,
        ema21: indicators.ema21[indicators.ema21.length - 1]?.value || 0,
        ema50: indicators.ema50[indicators.ema50.length - 1]?.value || 0,
      },
      psar: {
        value: latestPSAR?.value || 0,
        trend: latestPSAR?.trend || 0,
      },
      stochastic: {
        k: latestStoch?.k || 0,
        d: latestStoch?.d || 0,
      },
    };
  }
}