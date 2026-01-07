import { TRADING_CONFIG } from './constants';
import { createLogger } from './logger';
import { toCoinSymbol } from '@/lib/utils/symbol';
import {
  placeLimitOrderWithSLTP,
  getAccountBalance,
  calculatePositionSize,
  getPositions,
} from './trading';
import type { TradingSignal } from './ai';

const log = createLogger('auto-trader');

export interface AutoTradeResult {
  success?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  data?: unknown;
}

export interface AutoTradeParams {
  symbol: string;
  aiSignal: TradingSignal;
}

/**
 * Executes auto-trading based on AI signal if conditions are met
 *
 * Checks:
 * - Auto-trading enabled in config
 * - Signal is actionable (BUY/SELL, not HOLD)
 * - Confidence meets minimum threshold
 * - No existing position for symbol
 * - Sufficient account balance
 *
 * @returns AutoTradeResult with success/skip/error status
 */
export async function executeAutoTrade({
  symbol,
  aiSignal,
}: AutoTradeParams): Promise<AutoTradeResult> {
  // Check if auto-trading is enabled
  if (!TRADING_CONFIG.AUTO_TRADE_ENABLED) {
    log.info('Auto-trading is disabled');
    return { skipped: true, reason: 'Auto-trading disabled' };
  }

  // Check if signal meets trading criteria
  const shouldTrade = (
    (aiSignal.signal === 'BUY' || aiSignal.signal === 'STRONG_BUY' || aiSignal.signal === 'SELL' || aiSignal.signal === 'STRONG_SELL') &&
    aiSignal.confidence >= TRADING_CONFIG.MIN_CONFIDENCE_TO_TRADE
  );

  if (!shouldTrade) {
    log.info('Signal does not meet auto-trade criteria', {
      signal: aiSignal.signal,
      confidence: aiSignal.confidence,
      minConfidence: TRADING_CONFIG.MIN_CONFIDENCE_TO_TRADE,
    });
    return { skipped: true, reason: 'Signal does not meet criteria' };
  }

  log.info('Auto-trading conditions met - executing trade', {
    signal: aiSignal.signal,
    confidence: aiSignal.confidence,
  });

  try {
    // Check if there's already an open position
    const positions = await getPositions();
    const existingPosition = positions.find((p) => p.coin === toCoinSymbol(symbol));

    if (existingPosition) {
      log.warn('Position already exists for symbol, skipping trade', { symbol });
      return { skipped: true, reason: 'Position already exists' };
    }

    // Get account balance
    const balance = await getAccountBalance();
    log.info('Account balance retrieved', { balance });

    if (balance < 10) {
      log.warn('Insufficient balance for trading', { balance });
      return { skipped: true, reason: 'Insufficient balance' };
    }

    // Round prices to whole numbers FIRST (BTC requirement)
    const entryPrice = Math.round(aiSignal.entry_price);
    const stopLoss = Math.round(aiSignal.stop_loss);
    const takeProfit = Math.round(aiSignal.take_profit);

    // Calculate position size based on risk management
    const size = calculatePositionSize(balance, entryPrice, stopLoss);
    log.info('Position size calculated with risk management', {
      size,
      balance,
      entryPrice,
      stopLoss,
      riskPercentage: TRADING_CONFIG.RISK_PERCENTAGE,
    });

    // Determine trade side
    const side = aiSignal.signal === 'BUY' || aiSignal.signal === 'STRONG_BUY' ? 'BUY' : 'SELL';

    log.info('Executing LIMIT order with SL/TP', {
      symbol,
      side,
      entryPrice,
      stopLoss,
      takeProfit,
      size,
    });

    // Execute trade
    const orderResult = await placeLimitOrderWithSLTP({
      symbol,
      side,
      entryPrice,
      stopLoss,
      takeProfit,
      size,
      leverage: 1,
    });

    if (orderResult.success) {
      log.info('Trade executed successfully', { orderResult });
    } else {
      log.error('Trade execution failed', { error: orderResult.error, orderResult });
    }

    return orderResult;

  } catch (error) {
    log.error('Error during auto-trade execution', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}