import { Hyperliquid } from 'hyperliquid';
import { createLogger } from './logger';

const log = createLogger('trading');

// ============================================
// TYPES
// ============================================

export interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  size: number;
  orderType: 'MARKET' | 'LIMIT';
  price?: number;
  timeInForce?: 'Gtc' | 'Ioc';
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
}

// ============================================
// SDK CLIENT
// ============================================

function getSDK() {
  const privateKey = process.env.HYPERLIQUID_API_WALLET_PRIVATE_KEY;
  const isTestnet = process.env.HYPERLIQUID_TESTNET === 'true';

  if (!privateKey) {
    throw new Error('HYPERLIQUID_API_WALLET_PRIVATE_KEY not configured');
  }

  return new Hyperliquid({ privateKey, testnet: isTestnet, enableWs: false });
}

function getWalletAddress(): string {
  return process.env.HYPERLIQUID_WALLET_ADDRESS || '0x9C28606164F91EB901ac54C5e68C6a85bC7369f9';
}

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
  return state.assetPositions.filter((p: Position) => parseFloat(p.szi) !== 0);
}

export async function getOpenOrders(symbol?: string): Promise<OpenOrder[]> {
  const sdk = getSDK();
  const wallet = getWalletAddress();
  const orders = await sdk.info.getUserOpenOrders(wallet);

  if (!orders || orders.length === 0) return [];
  if (!symbol) return orders;

  const coin = `${symbol}-PERP`;
  return orders.filter((o: OpenOrder) => o.coin === coin);
}

// ============================================
// ORDER PLACEMENT
// ============================================

export async function placeOrder(order: OrderRequest): Promise<OrderResponse> {
  try {
    const sdk = getSDK();
    const coin = `${order.symbol}-PERP`;

    let limitPrice = order.price;

    // For MARKET orders, get current price + small slippage
    if (order.orderType === 'MARKET') {
      const meta = await sdk.info.perpetuals.getAssetMeta();
      const assetInfo = meta.universe.find((u: { name: string; midPx?: string; markPx?: string }) => u.name === coin);
      if (!assetInfo) throw new Error(`Asset ${coin} not found`);

      const midPrice = parseFloat(assetInfo.midPx || assetInfo.markPx);
      const slippage = order.side === 'BUY' ? 1.005 : 0.995; // 0.5% slippage
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
    const { symbol, side, entryPrice, stopLoss, takeProfit, size, leverage = 1 } = params;
    const sdk = getSDK();
    const coin = `${symbol}-PERP`;

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
    const coin = `${symbol}-PERP`;
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
    const coin = `${symbol}-PERP`;

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
        const sym = o.coin.replace('-PERP', '');
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
