"use client"

import { TradingSignal } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface SignalStatsProps {
  signals: TradingSignal[]
}

export function SignalStats({ signals }: SignalStatsProps) {
  const buyCount = signals.filter(s => s.signal === 'BUY' || s.signal === 'STRONG_BUY').length
  const sellCount = signals.filter(s => s.signal === 'SELL' || s.signal === 'STRONG_SELL').length
  const holdCount = signals.filter(s => s.signal === 'HOLD').length
  const totalCount = signals.length

  const buyPercentage = totalCount > 0 ? (buyCount / totalCount) * 100 : 0
  const sellPercentage = totalCount > 0 ? (sellCount / totalCount) * 100 : 0
  const holdPercentage = totalCount > 0 ? (holdCount / totalCount) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* BUY Signals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Buy Signals</CardTitle>
          <div className="rounded-md bg-green-500/10 p-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{buyCount}</div>
          <p className="text-xs text-muted-foreground">
            {buyPercentage.toFixed(1)}% of total signals
          </p>
        </CardContent>
      </Card>

      {/* SELL Signals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sell Signals</CardTitle>
          <div className="rounded-md bg-red-500/10 p-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sellCount}</div>
          <p className="text-xs text-muted-foreground">
            {sellPercentage.toFixed(1)}% of total signals
          </p>
        </CardContent>
      </Card>

      {/* HOLD Signals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hold Signals</CardTitle>
          <div className="rounded-md bg-yellow-500/10 p-2">
            <Minus className="h-4 w-4 text-yellow-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{holdCount}</div>
          <p className="text-xs text-muted-foreground">
            {holdPercentage.toFixed(1)}% of total signals
          </p>
        </CardContent>
      </Card>

      {/* Total Signals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
          <div className="rounded-md bg-primary/10 p-2">
            <Activity className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCount}</div>
          <p className="text-xs text-muted-foreground">
            All signals generated
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
