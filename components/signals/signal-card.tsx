"use client"

import { TradingSignal } from "@/types/database"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDateTime } from "@/lib/utils/formatters"
import { TrendingUp, TrendingDown, Minus, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface SignalCardProps {
  signal: TradingSignal
}

export function SignalCard({ signal }: SignalCardProps) {
  const isHold = signal.signal === 'HOLD'
  const isBuy = signal.signal === 'BUY' || signal.signal === 'STRONG_BUY'
  const isSell = signal.signal === 'SELL' || signal.signal === 'STRONG_SELL'

  // Calculate percentages and R:R ratio
  const entryPrice = signal.entry_price || 0
  const tpPrice = signal.take_profit || 0
  const slPrice = signal.stop_loss || 0

  const tpPercentage = entryPrice > 0 ? ((tpPrice - entryPrice) / entryPrice) * 100 : 0
  const slPercentage = entryPrice > 0 ? ((slPrice - entryPrice) / entryPrice) * 100 : 0

  const riskAmount = Math.abs(entryPrice - slPrice)
  const rewardAmount = Math.abs(tpPrice - entryPrice)
  const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0

  const signalConfig = {
    BUY: {
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      icon: TrendingUp,
      label: 'Buy',
      variant: 'success' as const
    },
    STRONG_BUY: {
      color: 'text-green-600',
      bg: 'bg-green-600/10',
      icon: TrendingUp,
      label: 'Strong Buy',
      variant: 'success' as const
    },
    SELL: {
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      icon: TrendingDown,
      label: 'Sell',
      variant: 'danger' as const
    },
    STRONG_SELL: {
      color: 'text-red-600',
      bg: 'bg-red-600/10',
      icon: TrendingDown,
      label: 'Strong Sell',
      variant: 'danger' as const
    },
    HOLD: {
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      icon: Minus,
      label: 'Hold',
      variant: 'outline' as const
    },
  }

  const config = signalConfig[signal.signal]
  const Icon = config.icon

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-lg p-2.5", config.bg)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{signal.symbol}</h3>
                <Badge variant={config.variant}>{config.label}</Badge>
                {!isHold && (
                  <Badge variant="outline">
                    R:R {riskRewardRatio.toFixed(2)}:1
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                <span>{formatDateTime(signal.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Confidence Chart */}
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs font-medium text-muted-foreground">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full transition-all",
                    signal.confidence >= 80 ? "bg-green-500" :
                    signal.confidence >= 60 ? "bg-yellow-500" :
                    "bg-red-500"
                  )}
                  style={{ width: `${signal.confidence}%` }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums">{signal.confidence.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid gap-4">
          {/* Price Levels */}
          {!isHold && (
            <div className="grid grid-cols-3 gap-3">
              {/* Entry Price */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1.5">Entry Price</div>
                <div className="font-mono text-base font-bold text-primary">
                  {formatPrice(signal.entry_price)}
                </div>
              </div>

              {/* Take Profit */}
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1.5">Take Profit</div>
                <div className="font-mono text-base font-bold text-green-600">
                  {formatPrice(signal.take_profit)}
                </div>
                <div className="mt-1.5 text-xs font-semibold text-green-600">
                  +{Math.abs(tpPercentage).toFixed(2)}%
                </div>
              </div>

              {/* Stop Loss */}
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1.5">Stop Loss</div>
                <div className="font-mono text-base font-bold text-red-600">
                  {formatPrice(signal.stop_loss)}
                </div>
                <div className="mt-1.5 text-xs font-semibold text-red-600">
                  {slPercentage.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {signal.ai_reasoning && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">AI Analysis</div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">
                {signal.ai_reasoning}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
