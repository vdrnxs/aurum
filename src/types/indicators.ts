export interface IndicatorResult {
  timestamp: number;
  value: number;
}

export interface SMAResult extends IndicatorResult {
  period: number;
}

export interface EMAResult extends IndicatorResult {
  period: number;
}

export interface RSIResult extends IndicatorResult {
  period: number;
}

export interface MACDResult {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsResult {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface ATRResult extends IndicatorResult {
  period: number;
}

export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type IndicatorType =
  | 'SMA'
  | 'EMA'
  | 'RSI'
  | 'MACD'
  | 'BB'
  | 'ATR'
  | 'STOCHASTIC'
  | 'ADX'
  | 'CCI';

export interface IndicatorConfig {
  type: IndicatorType;
  period?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  stdDev?: number;
}