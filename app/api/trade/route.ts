import { NextRequest, NextResponse } from 'next/server';
import {
  placeOrder,
  placeLimitOrderWithSLTP,
  closePosition,
  getPositions,
  getOpenOrders,
  getAccountBalance,
} from '@/lib/api/trading';

/**
 * POST /api/trade - Execute trade
 *
 * Body:
 * {
 *   "action": "OPEN" | "CLOSE",
 *   "symbol": "BTC",
 *   "signal": "BUY" | "SELL",
 *   "orderType": "MARKET" | "LIMIT",
 *   "entryPrice": 88000,     // Required for LIMIT
 *   "stopLoss": 87000,       // Optional
 *   "takeProfit": 90000,     // Optional
 *   "size": 0.001            // Position size
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const {
      action,
      symbol,
      signal,
      orderType = 'MARKET',
      entryPrice,
      stopLoss,
      takeProfit,
      size,
    } = body;

    // Validate
    if (!action || !symbol) {
      return NextResponse.json(
        { error: 'Missing required fields: action, symbol' },
        { status: 400 }
      );
    }

    // CLOSE position
    if (action === 'CLOSE') {
      const result = await closePosition(symbol);
      return NextResponse.json({
        success: result.success,
        action: 'CLOSE',
        symbol,
        result: result.data,
        error: result.error,
        processing_time_ms: Date.now() - startTime,
      }, { status: result.success ? 200 : 400 });
    }

    // OPEN position
    if (action === 'OPEN') {
      if (!signal || !size) {
        return NextResponse.json(
          { error: 'Missing required fields for OPEN: signal, size' },
          { status: 400 }
        );
      }

      if (!['BUY', 'SELL'].includes(signal)) {
        return NextResponse.json(
          { error: 'Invalid signal. Must be BUY or SELL' },
          { status: 400 }
        );
      }

      let result;

      // LIMIT order with SL/TP
      if (orderType === 'LIMIT' && stopLoss && takeProfit && entryPrice) {
        result = await placeLimitOrderWithSLTP({
          symbol,
          side: signal,
          entryPrice,
          stopLoss,
          takeProfit,
          size,
          leverage: 1,
        });
      }
      // Simple order (MARKET or LIMIT without SL/TP)
      else {
        result = await placeOrder({
          symbol,
          side: signal,
          size,
          orderType,
          price: entryPrice,
        });
      }

      return NextResponse.json({
        success: result.success,
        action: 'OPEN',
        symbol,
        signal,
        orderType,
        entryPrice,
        stopLoss,
        takeProfit,
        size,
        result: result.data,
        error: result.error,
        processing_time_ms: Date.now() - startTime,
      }, { status: result.success ? 200 : 400 });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be OPEN or CLOSE' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[Trade API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage, processing_time_ms: Date.now() - startTime },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trade - Get account info
 * Returns: balance, positions, open orders
 */
export async function GET() {
  try {
    const [balance, positions, orders] = await Promise.all([
      getAccountBalance(),
      getPositions(),
      getOpenOrders(),
    ]);

    // Map SDK orderType to our simplified types
    const mapOrderType = (sdkOrderType?: string): 'ENTRY' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'UNKNOWN' => {
      if (!sdkOrderType) return 'UNKNOWN';

      // SDK returns: "Limit", "Stop Market", "Take Profit Market", etc.
      if (sdkOrderType.includes('Stop')) return 'STOP_LOSS';
      if (sdkOrderType.includes('Take Profit')) return 'TAKE_PROFIT';
      if (sdkOrderType === 'Limit') return 'ENTRY';

      return 'UNKNOWN';
    };

    const formattedOrders = orders.map((o) => ({
      symbol: o.coin.replace('-PERP', ''),
      side: o.side,
      price: o.limitPx,
      size: o.sz,
      orderId: o.oid,
      timestamp: o.timestamp,
      reduceOnly: o.reduceOnly || false,
      orderType: mapOrderType(o.orderType),
      triggerCondition: o.triggerCondition,
    }));

    return NextResponse.json({
      success: true,
      accountBalance: balance,
      positions: positions.map((p) => ({
        symbol: p.coin.replace('-PERP', ''),
        size: p.szi,
        entryPrice: p.entryPx,
        unrealizedPnl: p.unrealizedPnl,
        leverage: p.leverage.value,
      })),
      openOrders: formattedOrders,
    });
  } catch (error) {
    console.error('[Trade API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
