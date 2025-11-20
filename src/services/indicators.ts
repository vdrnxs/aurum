import {
  sma,
  ema,
  rsi,
  macd,
  atr,
  bb,
  stochasticOscillator,
  communityChannelIndex,
} from 'indicatorts';
import type { Candle } from '../types/database';
import type {
  SMAResult,
  EMAResult,
  RSIResult,
  MACDResult,
  BollingerBandsResult,
  ATRResult,
  OHLCVData,
} from '../types/indicators';

export class IndicatorService {
  static candlesToOHLCV(candles: Candle[]): OHLCVData[] {
    return candles.map((candle) => ({
      timestamp: candle.open_time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    }));
  }

  static calculateSMA(candles: Candle[], period: number = 20): SMAResult[] {
    const closes = candles.map((c) => c.close);
    const smaValues = sma(closes, { period });

    return smaValues.map((value, index) => ({
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
    const bbResult = bb(closes, { period });

    const upper = bbResult.upper;
    const middle = bbResult.middle;
    const lower = bbResult.lower;

    return upper.map((upperValue, index) => ({
      timestamp: candles[index + period - 1]?.open_time || 0,
      upper: upperValue,
      middle: middle[index],
      lower: lower[index],
    }));
  }

  static calculateATR(candles: Candle[], period: number = 14): ATRResult[] {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const closes = candles.map((c) => c.close);

    const atrResult = atr(highs, lows, closes, { period });
    const atrLine = atrResult.atrLine;

    return atrLine.map((value, index) => ({
      timestamp: candles[index + period]?.open_time || 0,
      value,
      period,
    }));
  }

  static calculateStochastic(
    candles: Candle[],
    kPeriod: number = 14,
    dPeriod: number = 3
  ) {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const closes = candles.map((c) => c.close);

    return stochasticOscillator(highs, lows, closes, {
      kPeriod,
      dPeriod,
    });
  }

  static calculateCCI(candles: Candle[], period: number = 20) {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const closes = candles.map((c) => c.close);

    return communityChannelIndex(highs, lows, closes, { period });
  }

  static calculateMultipleIndicators(candles: Candle[]) {
    return {
      sma20: this.calculateSMA(candles, 20),
      sma50: this.calculateSMA(candles, 50),
      ema12: this.calculateEMA(candles, 12),
      ema26: this.calculateEMA(candles, 26),
      rsi14: this.calculateRSI(candles, 14),
      macd: this.calculateMACD(candles),
      bb: this.calculateBollingerBands(candles),
      atr14: this.calculateATR(candles, 14),
    };
  }
}