'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Position {
  symbol: string;
  size: string;
  entryPrice: string;
  unrealizedPnl: string;
  leverage: string;
}

interface Order {
  symbol: string;
  side: string;
  price: string;
  size: string;
  orderId: number;
  timestamp: number;
  reduceOnly: boolean;
  orderType: 'ENTRY' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'UNKNOWN';
  triggerCondition?: string;
}

interface AccountData {
  success: boolean;
  accountBalance: string;
  positions: Position[];
  openOrders: Order[];
}

export default function TradingDashboard() {
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/trade');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch account data');
      }

      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAccountData();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAccountData();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatPrice = (price: string | number) => {
    return Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPnL = (pnl: string) => {
    const value = Number(pnl);
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    const icon = value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;

    return (
      <span className={`flex items-center gap-1 font-semibold ${color}`}>
        {icon}
        ${formatPrice(Math.abs(value))}
      </span>
    );
  };

  const getOrderTypeBadge = (orderType: Order['orderType'], side: string) => {
    // Determine colors based on order type
    let bgColor = '';
    let textColor = '';
    let label = '';

    switch (orderType) {
      case 'ENTRY':
        bgColor = side === 'buy' ? 'bg-blue-500' : 'bg-orange-500';
        textColor = 'text-white';
        label = side === 'buy' ? 'LONG Entry' : 'SHORT Entry';
        break;
      case 'STOP_LOSS':
        bgColor = 'bg-red-500';
        textColor = 'text-white';
        label = 'Stop Loss';
        break;
      case 'TAKE_PROFIT':
        bgColor = 'bg-green-500';
        textColor = 'text-white';
        label = 'Take Profit';
        break;
      default:
        bgColor = 'bg-gray-500';
        textColor = 'text-white';
        label = 'Unknown';
    }

    return (
      <Badge className={`${bgColor} ${textColor} hover:${bgColor}/90`}>
        {label}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={fetchAccountData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Hyperliquid Testnet - Real-time account data
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAccountData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Account Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Account Balance
          </CardTitle>
          <CardDescription>Available margin for trading</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <p className="text-4xl font-bold">
              ${formatPrice(data?.accountBalance || '0')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Open Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
          <CardDescription>
            {data?.positions.length || 0} active position(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : data?.positions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No open positions
            </p>
          ) : (
            <div className="space-y-4">
              {data?.positions.map((position, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{position.symbol}</h3>
                      <Badge variant={Number(position.size) > 0 ? 'default' : 'destructive'}>
                        {Number(position.size) > 0 ? 'LONG' : 'SHORT'}
                      </Badge>
                      <Badge variant="outline">{position.leverage}x</Badge>
                    </div>
                    {formatPnL(position.unrealizedPnl)}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium">{position.size}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Entry Price</p>
                      <p className="font-medium">${formatPrice(position.entryPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unrealized PnL</p>
                      <p className="font-medium">${formatPrice(position.unrealizedPnl)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Open Orders</CardTitle>
          <CardDescription>
            {data?.openOrders.length || 0} pending order(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : data?.openOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No open orders
            </p>
          ) : (
            <div className="space-y-3">
              {data?.openOrders.map((order, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{order.symbol}</h3>
                      {getOrderTypeBadge(order.orderType, order.side)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ID: {order.orderId}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">${formatPrice(order.price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium">{order.size}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time</p>
                      <p className="font-medium">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {order.triggerCondition && order.triggerCondition !== 'N/A' && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Trigger: {order.triggerCondition}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
