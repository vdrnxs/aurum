import { Badge } from '@/components/ui/badge';
import { TokenBTC, TokenETH, TokenSOL } from '@web3icons/react';

interface PositionRoadmapProps {
  position: {
    symbol: string;
    size: string;
    entryPrice: string;
    unrealizedPnl: string;
    leverage: string;
  };
  orders: Array<{
    symbol: string;
    side: string;
    price: string;
    orderType: 'ENTRY' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'UNKNOWN';
    reduceOnly: boolean;
  }>;
}

export function PositionRoadmap({ position, orders }: PositionRoadmapProps) {
  const isLong = Number(position.size) > 0;
  const entryPrice = Number(position.entryPrice);
  const pnl = Number(position.unrealizedPnl);
  const positionSize = Math.abs(Number(position.size));

  // Calculate current price from entry + PnL
  // For LONG: currentPrice = entry + (pnl / size)
  // For SHORT: currentPrice = entry - (pnl / size)
  // Note: PnL already has correct sign (positive = profit, negative = loss)
  const currentPrice = isLong
    ? entryPrice + pnl / positionSize
    : entryPrice - pnl / positionSize;

  // Find TP/SL orders for this position
  const relatedOrders = orders.filter(
    (o) =>
      o.symbol === position.symbol &&
      o.reduceOnly &&
      (o.orderType === 'STOP_LOSS' || o.orderType === 'TAKE_PROFIT')
  );

  const stopLoss = relatedOrders.find((o) => o.orderType === 'STOP_LOSS');
  const takeProfit = relatedOrders.find((o) => o.orderType === 'TAKE_PROFIT');

  const slPrice = stopLoss ? Number(stopLoss.price) : null;
  const tpPrice = takeProfit ? Number(takeProfit.price) : null;

  // Calculate percentages
  const tpPercentage = tpPrice
    ? ((Math.abs(tpPrice - currentPrice) / currentPrice) * 100).toFixed(2)
    : null;
  const slPercentage = slPrice
    ? ((Math.abs(slPrice - currentPrice) / currentPrice) * 100).toFixed(2)
    : null;

  // Risk/Reward calculation
  const riskAmount = slPrice ? Math.abs(entryPrice - slPrice) : 0;
  const rewardAmount = tpPrice ? Math.abs(tpPrice - entryPrice) : 0;
  const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  const isProfitable = pnl >= 0;

  // Calculate price movement from entry
  const priceChangePercent = isLong
    ? ((currentPrice - entryPrice) / entryPrice) * 100
    : ((entryPrice - currentPrice) / entryPrice) * 100;

  // Format price with proper thousands separator
  const formatPrice = (price: number) => {
    return Math.round(price).toLocaleString('en-US');
  };

  // Calculate line lengths based on R:R
  const totalRR = riskRewardRatio + 1; // Total parts (risk + reward)
  const leftLinePercent = (1 / totalRR) * 100; // Risk portion
  const rightLinePercent = (riskRewardRatio / totalRR) * 100; // Reward portion

  // For SHORT positions, we need to swap the layout (TP is above entry, SL is below)
  const leftIsTP = !isLong;
  const leftPrice = leftIsTP ? tpPrice : slPrice;
  const rightPrice = leftIsTP ? slPrice : tpPrice;
  const leftPercentage = leftIsTP ? tpPercentage : slPercentage;
  const rightPercentage = leftIsTP ? slPercentage : tpPercentage;

  // Token icon mapping
  const tokenIcons: Record<string, typeof TokenBTC> = {
    'BTC': TokenBTC,
    'ETH': TokenETH,
    'SOL': TokenSOL,
  };
  const TokenIcon = tokenIcons[position.symbol] || TokenBTC;

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Header */}
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-muted p-2">
              <TokenIcon size={16} variant="branded" />
            </div>
            <h3 className="font-bold text-lg">{position.symbol}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isLong ? 'default' : 'secondary'} className="text-xs">
              {isLong ? 'LONG' : 'SHORT'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {position.leverage}x
            </Badge>
          </div>
        </div>
      </div>

      {/* Simplified Horizontal Layout */}
      <div className="p-6">
        <div className="relative flex items-center justify-between">
          {/* Left Badge (TP for SHORT, SL for LONG) */}
          {leftPrice && (
            <div className="flex flex-col items-center gap-1 z-10 bg-background px-2">
              <Badge
                variant="outline"
                className={leftIsTP
                  ? "border-green-500 text-green-600 dark:text-green-400 font-bold"
                  : "border-red-500 text-red-600 dark:text-red-400 font-bold"
                }
              >
                {leftIsTP ? 'TP' : 'SL'}
              </Badge>
              <div className={`text-sm font-mono font-bold ${
                leftIsTP
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatPrice(leftPrice)}
              </div>
              <div className="text-xs text-muted-foreground">
                {leftIsTP ? '+' : '-'}{leftPercentage}%
              </div>
            </div>
          )}

          {/* Connection Lines */}
          <div className="absolute left-0 right-0 top-3 flex items-center">
            {/* Left line (Risk side for LONG, Reward side for SHORT) */}
            <div
              className="h-0.5 bg-border relative"
              style={{ width: `${leftLinePercent}%` }}
            >
              {/* Dot on this line if price moved in this direction */}
              {((leftIsTP && isProfitable) || (!leftIsTP && !isProfitable)) && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className={`w-3 h-3 rounded-full border-2 border-background animate-pulse ${
                    isProfitable ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className={`text-xs font-bold ${
                      isProfitable ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isProfitable ? '+' : ''}{priceChangePercent.toFixed(2)}% ({isProfitable ? '+' : ''}${pnl.toFixed(2)})
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Entry Price Badge (center) */}
            <div className="flex flex-col items-center gap-1 px-4 z-10 bg-background">
              <Badge variant="outline" className="font-bold">
                Entry
              </Badge>
              <div className="text-sm font-mono font-bold">
                {formatPrice(entryPrice)}
              </div>
            </div>

            {/* Right line (Reward side for LONG, Risk side for SHORT) */}
            <div
              className="h-0.5 bg-border relative"
              style={{ width: `${rightLinePercent}%` }}
            >
              {/* Dot on this line if price moved in this direction */}
              {((!leftIsTP && isProfitable) || (leftIsTP && !isProfitable)) && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className={`w-3 h-3 rounded-full border-2 border-background animate-pulse ${
                    isProfitable ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className={`text-xs font-bold ${
                      isProfitable ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isProfitable ? '+' : ''}{priceChangePercent.toFixed(2)}% ({isProfitable ? '+' : ''}${pnl.toFixed(2)})
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Badge (SL for SHORT, TP for LONG) */}
          {rightPrice && (
            <div className="flex flex-col items-center gap-1 z-10 bg-background px-2">
              <Badge
                variant="outline"
                className={leftIsTP
                  ? "border-red-500 text-red-600 dark:text-red-400 font-bold"
                  : "border-green-500 text-green-600 dark:text-green-400 font-bold"
                }
              >
                {leftIsTP ? 'SL' : 'TP'}
              </Badge>
              <div className={`text-sm font-mono font-bold ${
                leftIsTP
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {formatPrice(rightPrice)}
              </div>
              <div className="text-xs text-muted-foreground">
                {leftIsTP ? '-' : '+'}{rightPercentage}%
              </div>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {/* Position Size Card */}
          <div className="rounded-lg bg-muted/50 border p-3">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              Position Size
            </div>
            <div className="text-lg font-bold">
              {positionSize}
            </div>
          </div>

          {/* Max Risk Card */}
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
              Max Risk
            </div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {slPrice ? `$${(positionSize * riskAmount).toFixed(2)}` : 'N/A'}
            </div>
          </div>

          {/* Potential Reward Card */}
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
            <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
              Potential Reward
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {tpPrice ? `$${(positionSize * rewardAmount).toFixed(2)}` : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}