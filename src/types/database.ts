export interface HyperliquidCandle {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
}

export interface Candle {
  id: number;
  symbol: string;
  interval: string;
  open_time: number;
  close_time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades_count: number;
  created_at: string;
}

export type CandleInterval =
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M';

export type CryptoSymbol = 'BTC' | 'ETH' | string;

export type CandleInsert = Omit<Candle, 'id' | 'created_at'>;

// Trading Signal Types
export type SignalType = 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL';

export interface TradingSignal {
  id: number;
  symbol: string;
  interval: string;
  created_at: string;
  candles_timestamp: number;
  signal: SignalType;
  confidence: number;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  ai_reasoning: string | null;
  toon_data?: string | null;
  indicators_data?: Record<string, any> | null;
}