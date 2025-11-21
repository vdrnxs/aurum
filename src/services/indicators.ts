import { sma, rsi, macd, bollingerBands, atr } from 'indicatorts';
import type { Candle } from '../types/database';
import type { SMAResult, RSIResult, MACDResult, BollingerBandsResult, ATRResult } from '../types/indicators';

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

  static calculateAll(candles: Candle[]) {
    return {
      sma100: this.calculateSMA(candles, 100),
      rsi14: this.calculateRSI(candles, 14),
      macd: this.calculateMACD(candles, 24, 52, 9),
      bollingerBands: this.calculateBollingerBands(candles, 20),
      atr14: this.calculateATR(candles, 14),
    };
  }

  static getLatestValues(candles: Candle[]) {
    const indicators = this.calculateAll(candles);
    const currentPrice = candles[candles.length - 1].close;
    const latestBB = indicators.bollingerBands[indicators.bollingerBands.length - 1];
    const latestATR = indicators.atr14[indicators.atr14.length - 1];

    return {
      price: currentPrice,
      sma100: indicators.sma100[indicators.sma100.length - 1]?.value || 0,
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
    };
  }
}