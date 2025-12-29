import { NextRequest, NextResponse } from 'next/server';
import { getOpenOrders, cancelOrder, cancelAllOrders } from '@/lib/api/trading';

/**
 * GET /api/orders?symbol=BTC
 * Get open orders (optionally filtered by symbol)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol') || undefined;

    const orders = await getOpenOrders(symbol);

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders.map((o) => ({
        symbol: o.coin.replace('-PERP', ''),
        side: o.side,
        price: o.limitPx,
        size: o.sz,
        orderId: o.oid,
        timestamp: o.timestamp,
      })),
    });
  } catch (error) {
    console.error('[Orders API] GET Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders?symbol=BTC&orderId=12345
 * Cancel specific order or all orders for a symbol
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol') || undefined;
    const orderId = searchParams.get('orderId');

    // Cancel specific order
    if (symbol && orderId) {
      const result = await cancelOrder(symbol, parseInt(orderId));
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Order ${orderId} canceled`
          : `Failed to cancel order ${orderId}`,
        error: result.error,
        data: result.data,
      }, { status: result.success ? 200 : 400 });
    }

    // Cancel all orders (with optional symbol filter)
    const result = await cancelAllOrders(symbol);
    return NextResponse.json({
      success: result.success,
      message: symbol
        ? `Canceled all orders for ${symbol}`
        : 'Canceled all open orders',
      ...(result.data && typeof result.data === 'object' ? result.data : {}),
      error: result.error,
    }, { status: result.success ? 200 : 400 });

  } catch (error) {
    console.error('[Orders API] DELETE Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
