import { TRADING_CONFIG } from '@/lib/api/constants';

/**
 * Converts a base symbol to Hyperliquid perpetual format
 * @example toCoinSymbol('BTC') => 'BTC-PERP'
 */
export function toCoinSymbol(symbol: string): string {
  return `${symbol}${TRADING_CONFIG.COIN_SUFFIX}`;
}

/**
 * Converts a Hyperliquid perpetual symbol to base symbol
 * @example fromCoinSymbol('BTC-PERP') => 'BTC'
 */
export function fromCoinSymbol(coin: string): string {
  return coin.replace(TRADING_CONFIG.COIN_SUFFIX, '');
}

/**
 * Checks if a string is a valid perpetual symbol
 * @example isPerpSymbol('BTC-PERP') => true
 */
export function isPerpSymbol(value: string): boolean {
  return value.endsWith(TRADING_CONFIG.COIN_SUFFIX);
}