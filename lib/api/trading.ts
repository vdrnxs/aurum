import { createLogger } from './logger';
import { getSDK, getWalletAddress } from './sdk-client';
import { toCoinSymbol, fromCoinSymbol } from '@/lib/utils/symbol';
import { TRADING_CONFIG } from './constants';
import type {
  OrderRequest,
  OrderResponse,
  LimitOrderWithSLTPParams,
  Position,
  OpenOrder,
} from '@/types/trading';

const log = createLogger('trading');

// ============================================
// CORE FUNCTIONS
// ============================================

export async function getAccountBalance(): Promise<number> {
  const sdk = getSDK();
  const wallet = getWalletAddress();
  const state = await sdk.info.perpetuals.getClearinghouseState(wallet);
  return parseFloat(state.marginSummary.accountValue);
}

export async function getPositions(): Promise<Position[]> {
  const sdk = getSDK();
  const wallet = getWalletAddress();
  const state = await sdk.info.perpetuals.getClearinghouseState(wallet);
  return state.assetPositions
    .map((asset: { position: Position }) => asset.position)
    .filter((p: Position) => parseFloat(p.szi) !== 0);
}

export async function getOpenOrders(symbol?: string): Promise<OpenOrder[]> {
  const sdk = getSDK();
  const wallet = getWalletAddress();
  const orders = await sdk.info.getUserOpenOrders(wallet);

  if (!orders || orders.length === 0) return [];
  if (!symbol) return orders;

  const coin = toCoinSymbol(symbol);
  return orders.filter((o: OpenOrder) => o.coin === coin);
}

// ============================================
// ORDER PLACEMENT
// ============================================

export async function placeOrder(order: OrderRequest): Promise<OrderResponse> {
  try {
    const sdk = getSDK();
    const coin = toCoinSymbol(order.symbol);

    let limitPrice = order.price;

    // For MARKET orders, get current price + small slippage
    if (order.orderType === 'MARKET') {
      const allMids = await sdk.info.getAllMids();
      const midPrice = parseFloat(allMids[coin] || '0');

      if (midPrice === 0) {
        throw new Error(`Unable to get price for ${coin}`);
      }

      const slippage = order.side === 'BUY' ? TRADING_CONFIG.SLIPPAGE_BUY : TRADING_CONFIG.SLIPPAGE_SELL;
      limitPrice = Math.round(midPrice * slippage);
    }

    if (!limitPrice) {
      throw new Error('Price required for LIMIT orders');
    }

    log.info('Placing order', { coin, side: order.side, size: order.size, price: limitPrice });

    const result = await sdk.exchange.placeOrder({
      coin,
      is_buy: order.side === 'BUY',
      sz: order.size,
      limit_px: limitPrice,
      reduce_only: order.reduceOnly || false,
      order_type: order.orderType === 'LIMIT'
        ? { limit: { tif: order.timeInForce || 'Gtc' } }
        : { limit: { tif: 'Ioc' } },
    });

    if (result.status === 'ok') {
      log.info('Order placed successfully', { result });
      return { success: true, data: result };
    }

    log.error('Order failed', { result });
    return { success: false, error: 'Order rejected', data: result };

  } catch (error) {
    log.error('Order error', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function placeLimitOrderWithSLTP(
  params: LimitOrderWithSLTPParams
): Promise<OrderResponse> {
  try {
    const { symbol, side, entryPrice, stopLoss, takeProfit, size, leverage = TRADING_CONFIG.DEFAULT_LEVERAGE } = params;
    const sdk = getSDK();
    const coin = toCoinSymbol(symbol);

    // 1. Set leverage
    log.info('Setting leverage', { symbol, leverage });
    await sdk.exchange.updateLeverage(coin, 'cross', leverage);

    // 2. Place entry LIMIT order
    log.info('Placing entry order', { coin, side, price: entryPrice, size });
    const entryResult = await sdk.exchange.placeOrder({
      coin,
      is_buy: side === 'BUY',
      sz: size,
      limit_px: entryPrice,
      reduce_only: false,
      order_type: { limit: { tif: 'Gtc' } },
    });

    if (entryResult.status !== 'ok') {
      return { success: false, error: 'Entry order failed', data: entryResult };
    }

    // 3. Place Stop Loss trigger
    const slSide = side === 'BUY' ? false : true; // Opposite side
    log.info('Placing Stop Loss', { price: stopLoss });
    const slResult = await sdk.exchange.placeOrder({
      coin,
      is_buy: slSide,
      sz: size,
      limit_px: stopLoss,
      reduce_only: true,
      order_type: {
        trigger: { triggerPx: stopLoss, isMarket: true, tpsl: 'sl' as const },
      },
      grouping: 'positionTpsl' as const,
    });

    // 4. Place Take Profit trigger
    log.info('Placing Take Profit', { price: takeProfit });
    const tpResult = await sdk.exchange.placeOrder({
      coin,
      is_buy: slSide,
      sz: size,
      limit_px: takeProfit,
      reduce_only: true,
      order_type: {
        trigger: { triggerPx: takeProfit, isMarket: true, tpsl: 'tp' as const },
      },
      grouping: 'positionTpsl' as const,
    });

    return {
      success: true,
      data: {
        entryOrder: entryResult,
        stopLossOrder: slResult,
        takeProfitOrder: tpResult,
        slSuccess: slResult.status === 'ok',
        tpSuccess: tpResult.status === 'ok',
      },
    };
  } catch (error) {
    log.error('LIMIT order with SL/TP failed', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function closePosition(symbol: string): Promise<OrderResponse> {
  try {
    const positions = await getPositions();
    const coin = toCoinSymbol(symbol);
    const position = positions.find((p) => p.coin === coin);

    if (!position) {
      return { success: false, error: `No open position for ${symbol}` };
    }

    const size = Math.abs(parseFloat(position.szi));
    const side = parseFloat(position.szi) > 0 ? 'SELL' : 'BUY';

    log.info('Closing position', { symbol, size, side });

    return await placeOrder({
      symbol,
      side,
      size,
      orderType: 'MARKET',
      reduceOnly: true,
    });
  } catch (error) {
    log.error('Close position failed', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function cancelOrder(symbol: string, orderId: number): Promise<OrderResponse> {
  try {
    const sdk = getSDK();
    const coin = toCoinSymbol(symbol);

    log.info('Canceling order', { coin, orderId });
    const result = await sdk.exchange.cancelOrder({ coin, o: orderId });

    if (result.status === 'ok') {
      return { success: true, data: result };
    }

    return { success: false, error: 'Cancel failed', data: result };
  } catch (error) {
    log.error('Cancel order failed', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function cancelAllOrders(symbol?: string): Promise<OrderResponse> {
  try {
    const orders = await getOpenOrders(symbol);

    if (orders.length === 0) {
      return { success: true, data: { message: 'No orders to cancel' } };
    }

    log.info(`Canceling ${orders.length} order(s)`);

    const results = await Promise.all(
      orders.map((o) => {
        const sym = fromCoinSymbol(o.coin);
        return cancelOrder(sym, o.oid);
      })
    );

    const allSuccess = results.every((r) => r.success);

    return {
      success: allSuccess,
      data: {
        canceled: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    };
  } catch (error) {
    log.error('Cancel all orders failed', { error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
