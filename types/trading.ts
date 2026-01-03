/**
 * Centralized trading types
 * Used across API routes and trading service
 */

export interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  size: number;
  orderType: 'MARKET' | 'LIMIT';
  price?: number;
  timeInForce?: 'Gtc' | 'Ioc';
  reduceOnly?: boolean;
}

export interface OrderResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface LimitOrderWithSLTPParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  size: number;
  leverage?: number;
}

export interface Position {
  coin: string;
  szi: string;
  entryPx: string;
  unrealizedPnl: string;
  leverage: { value: number };
}

export interface OpenOrder {
  coin: string;
  side: string;
  limitPx: string;
  sz: string;
  oid: number;
  timestamp: number;
  reduceOnly?: boolean;
  orderType?: string; // "Limit", "Stop Market", "Take Profit Market", etc.
  isTrigger?: boolean;
  triggerPx?: string; // SDK returns string, not number
  triggerCondition?: string;
  isPositionTpsl?: boolean;
  origSz?: string;
}