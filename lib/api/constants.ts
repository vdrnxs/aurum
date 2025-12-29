/**
 * Backend API constants
 * For frontend constants, see lib/constants.ts
 */

// OpenAI Configuration
export const AI_CONFIG = {
  TEMPERATURE: 0.9,
  MAX_TOKENS: 500,
  MIN_RR_RATIO: 3.0,
  MODEL: 'gpt-4o-mini',
} as const;

// ATR Multipliers for price calculation (used by AI)
export const ATR_CONFIG = {
  MULTIPLIER_SL: 1.5, // Stop Loss = ATR × 1.5
  MULTIPLIER_TP: 3.5, // Take Profit = ATR × 3.5
} as const;

// Price Validation
export const PRICE_VALIDATION = {
  PSYCHOLOGICAL_LEVELS: [1000, 5000], // Round numbers to check
  MIN_PRICE: 0, // Minimum valid price
} as const;

// API Validation
export const API_LIMITS = {
  MIN_CANDLES: 50,
  MAX_CANDLES: 500,
  DEFAULT_CANDLES: 100,
} as const;

// Supported Intervals
export const SUPPORTED_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

// Trading Configuration
export const TRADING_CONFIG = {
  SLIPPAGE_BUY: 1.005,  // 0.5% slippage for buy orders
  SLIPPAGE_SELL: 0.995, // 0.5% slippage for sell orders
  DEFAULT_LEVERAGE: 1,
  COIN_SUFFIX: '-PERP',
} as const;