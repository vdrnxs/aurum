/**
 * Backend API constants
 * Centralized configuration for magic numbers and common values
 */

// AI Configuration
export const AI_CONFIG = {
  TEMPERATURE: 0.9,
  MAX_TOKENS: 500,
  MIN_RR_RATIO: 3.0,
  MODEL: 'gpt-4o-mini',
} as const;

// RSI Thresholds
export const RSI_THRESHOLDS = {
  OVERBOUGHT: 75,
  OVERSOLD: 25,
  NEUTRAL: 50,
} as const;

// Stochastic Thresholds
export const STOCHASTIC_THRESHOLDS = {
  OVERBOUGHT: 80,
  OVERSOLD: 20,
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

// Supported Trading Pairs
export const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AVAX', 'ARB', 'MATIC', 'DOGE', 'LINK'] as const;

// Supported Intervals
export const SUPPORTED_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

// Signal Types
export const SIGNAL_TYPES = ['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL'] as const;