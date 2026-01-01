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

  // For LONG: TP > EP, SL < EP (positive TP%, negative SL%)
  // For SHORT: TP < EP, SL > EP (negative TP%, positive SL%)
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
                  className="h-full bg-white transition-all"
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
          {/* Price Levels - Trading Terminal Style */}
          {!isHold && (
            <div className={cn(
              "relative overflow-hidden rounded-xl border-2 border-border p-6",
              isBuy ? "bg-gradient-to-r from-red-500/5 via-primary/5 to-green-500/5" : "bg-gradient-to-r from-green-500/5 via-primary/5 to-red-500/5"
            )}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* LEFT SIDE - Context aware (SL for LONG, TP for SHORT) */}
                {isBuy ? (
                  <div className="relative text-center md:text-left">
                    <div className="mb-3 flex items-center justify-center md:justify-start">
                      <div className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-600">
                        SL
                      </div>
                    </div>
                    <div className="font-mono text-4xl font-bold tracking-tight text-red-600">
                      {formatPrice(signal.stop_loss)}
                    </div>
                    <div className="mt-2 text-lg font-bold text-red-600">
                      {slPercentage.toFixed(2)}%
                    </div>
                  </div>
                ) : (
                  <div className="relative text-center md:text-left">
                    <div className="mb-3 flex items-center justify-center md:justify-start">
                      <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-600">
                        TP
                      </div>
                    </div>
                    <div className="font-mono text-4xl font-bold tracking-tight text-green-600">
                      {formatPrice(signal.take_profit)}
                    </div>
                    <div className="mt-2 text-lg font-bold text-green-600">
                      {tpPercentage.toFixed(2)}%
                    </div>
                  </div>
                )}

                {/* Entry Price - CENTER (Always) */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 opacity-50" />
                  <div className="relative text-center px-4 py-2">
                    <div className="mb-3 flex items-center justify-center">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entry Price</div>
                    </div>
                    <div className="font-mono text-5xl font-bold tracking-tight text-primary">
                      {formatPrice(signal.entry_price)}
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE - Context aware (TP for LONG, SL for SHORT) */}
                {isBuy ? (
                  <div className="relative text-center md:text-right">
                    <div className="mb-3 flex items-center justify-center md:justify-end">
                      <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-600">
                        TP
                      </div>
                    </div>
                    <div className="font-mono text-4xl font-bold tracking-tight text-green-600">
                      {formatPrice(signal.take_profit)}
                    </div>
                    <div className="mt-2 text-lg font-bold text-green-600">
                      +{Math.abs(tpPercentage).toFixed(2)}%
                    </div>
                  </div>
                ) : (
                  <div className="relative text-center md:text-right">
                    <div className="mb-3 flex items-center justify-center md:justify-end">
                      <div className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-600">
                        SL
                      </div>
                    </div>
                    <div className="font-mono text-4xl font-bold tracking-tight text-red-600">
                      {formatPrice(signal.stop_loss)}
                    </div>
                    <div className="mt-2 text-lg font-bold text-red-600">
                      +{Math.abs(slPercentage).toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Separators */}
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent opacity-50" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent opacity-50" />
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
