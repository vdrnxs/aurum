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

export interface EMAResult extends IndicatorResult {
  period: number;
}

export interface PSARResult {
  timestamp: number;
  value: number;
  trend: number;
}

export interface StochResult {
  timestamp: number;
  k: number;
  d: number;
}

export interface LatestIndicators {
  price: number;
  sma: {
    sma20: number;
    sma50: number;
  };
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
  ema: {
    ema9: number;
    ema21: number;
    ema50: number;
  };
  psar: {
    value: number;
    trend: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
}

export type IndicatorType = 'SMA' | 'RSI' | 'MACD' | 'BB' | 'ATR';

export interface AIPayloadMetadata {
  symbol: string;
  interval: string;
  timestamp: number;
  candleCount: number;
  historyDepth: number;
}

export interface RecentPriceHistory {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RecentIndicatorHistory {
  prices: RecentPriceHistory[];
  sma: SMAResult[];
  rsi: RSIResult[];
}

export interface AIPayload {
  metadata: AIPayloadMetadata;
  current: LatestIndicators;
  recentHistory: RecentIndicatorHistory;
}

export interface TokenComparison {
  jsonTokens: number;
  toonTokens: number;
  reduction: number;
  reductionPercent: string;
}