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
    switch (orderType) {
      case 'ENTRY':
        const isLong = side === 'buy';
        return (
          <Badge className={isLong ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'}>
            {isLong ? 'LONG Entry' : 'SHORT Entry'}
          </Badge>
        );
      case 'STOP_LOSS':
        return (
          <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400">
            SL
          </Badge>
        );
      case 'TAKE_PROFIT':
        return (
          <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
            TP
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
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
    <div className="container mx-auto p-6 space-y-4">
      {/* Header with prominent Balance */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Primary Balance KPI */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Account Balance</p>
            {loading && !data ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <p className="text-3xl font-bold">${formatPrice(data?.accountBalance || '0')}</p>
            )}
          </div>

          {/* Secondary KPIs */}
          <div className="flex items-center gap-6 pl-8 border-l">
            <div>
              <p className="text-xs text-muted-foreground">Positions</p>
              {loading && !data ? (
                <Skeleton className="h-6 w-8" />
              ) : (
                <p className="text-lg font-bold">{data?.positions.length || 0}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orders</p>
              {loading && !data ? (
                <Skeleton className="h-6 w-8" />
              ) : (
                <p className="text-lg font-bold">{data?.openOrders.length || 0}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAccountData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="min-w-24"
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Positions & Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Positions */}
        {data?.positions && data.positions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Active Positions</h2>
            <div className="space-y-2">
              {data?.positions.map((position, idx) => {
                const isLong = Number(position.size) > 0;
                const pnlValue = Number(position.unrealizedPnl);
                const isProfitable = pnlValue >= 0;

                return (
                  <div key={idx} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{position.symbol}</h3>
                        <Badge variant="default" className="text-xs">
                          {isLong ? 'LONG' : 'SHORT'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{position.leverage}x</Badge>
                      </div>
                      <div className={`text-sm font-bold ${
                        isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isProfitable ? '+' : ''}${formatPrice(position.unrealizedPnl)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Size</p>
                        <p className="font-medium">{Math.abs(Number(position.size))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Entry</p>
                        <p className="font-medium">${formatPrice(position.entryPrice)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Book */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Order Book</h2>
          <div className="space-y-2">
            {loading && !data ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : data?.openOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">
                No open orders
              </p>
            ) : (
              data?.openOrders.map((order, idx) => (
                <div key={idx} className="border rounded-lg p-3 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{order.symbol}</h3>
                      {getOrderTypeBadge(order.orderType, order.side)}
                    </div>
                    <span className="text-xs text-muted-foreground">#{order.orderId}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
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
                      <p className="font-medium">{new Date(order.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
