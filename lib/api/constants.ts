/**
 * Backend API constants
 * For frontend constants, see lib/constants.ts
 */

// AI Configuration (Cerebras z.ai-glm-4.6)
export const AI_CONFIG = {
  TEMPERATURE: 1,
  MAX_TOKENS: 8000,
  MIN_RR_RATIO: 3.0,
  MODEL: 'zai-glm-4.6',
} as const;

// ATR Multipliers for price calculation (used by AI)
export const ATR_CONFIG = {
  MULTIPLIER_SL: 1.75, // Stop Loss = ATR × 1.5
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

  // Auto-trading configuration
  AUTO_TRADE_ENABLED: true,  // Set to false to disable auto-trading
  MIN_CONFIDENCE_TO_TRADE: 60,  // Only trade signals with confidence >= 60%

  // Risk Management (Position Sizing)
  RISK_PERCENTAGE: 2,  // Risk 2% of account balance per trade (max loss if SL hits)
  MAX_POSITION_PERCENTAGE: 10,  // Maximum 10% of balance per position (not 95%!)
  MIN_POSITION_VALUE_USD: 10,  // Minimum $10 position (Hyperliquid requirement)
  MIN_POSITION_SIZE_BTC: 0.001,  // Minimum 0.001 BTC (fallback)
} as const;