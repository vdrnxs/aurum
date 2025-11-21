export interface IndicatorResult {
  timestamp: number;
  value: number;
}

export interface SMAResult extends IndicatorResult {
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

export interface LatestIndicators {
  price: number;
  sma100: number;
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
}

export type IndicatorType = 'SMA' | 'RSI' | 'MACD' | 'BB' | 'ATR';