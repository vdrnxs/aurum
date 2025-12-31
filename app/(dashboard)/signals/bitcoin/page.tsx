"use client"

import { useEffect, useState } from "react"
import { SignalCard } from "@/components/signals/signal-card"
import { SignalsTable } from "@/components/signals/signals-table"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { getLatestSignal, getSignalHistory, getSignalStats } from "@/lib/services/signals-service"
import { TradingSignal } from "@/types/database"
import { Card, CardContent } from "@/components/ui/card"

export default function BitcoinSignalsPage() {
  const [latestSignal, setLatestSignal] = useState<TradingSignal | null>(null)
  const [signalHistory, setSignalHistory] = useState<TradingSignal[]>([])
  const [stats, setStats] = useState({
    totalSignals: 0,
    buySignals: 0,
    sellSignals: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [latest, history, statsData] = await Promise.all([
          getLatestSignal('BTC'),
          getSignalHistory('BTC'),
          getSignalStats('BTC'),
        ])

        setLatestSignal(latest)
        setSignalHistory(history)
        setStats(statsData)
      } catch (error) {
        console.error('Error fetching Bitcoin data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Top Row Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Latest Signal Skeleton */}
          <Card className="animate-pulse lg:col-span-2">
            <CardContent className="p-6">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="mt-6 space-y-5">
                {/* Top Row: Chart + Entry Price */}
                <div className="flex items-center gap-6">
                  <div className="h-[140px] w-[140px] shrink-0 rounded-full bg-muted" />
                  <div className="h-[140px] flex-1">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="mt-2 h-12 w-48 rounded bg-muted" />
                  </div>
                </div>
                {/* SL/TP Grid */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="h-32 rounded-lg bg-muted" />
                  <div className="h-32 rounded-lg bg-muted" />
                </div>
                {/* AI Analysis */}
                <div className="h-28 rounded-lg bg-muted" />
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart Skeleton */}
          <Card className="animate-pulse lg:col-span-1">
            <CardContent className="p-6">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="mx-auto mt-6 h-48 w-48 rounded-full bg-muted" />
            </CardContent>
          </Card>
        </div>

        {/* Table Skeleton */}
        <div className="animate-pulse">
          <div className="mb-4 h-5 w-32 rounded bg-muted" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Latest Signal and Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Signal with AI Analysis */}
        <div className="lg:col-span-2">
          {latestSignal ? (
            <SignalCard signal={latestSignal} />
          ) : (
            <Card className="flex items-center justify-center">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No signals available yet</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Signal Distribution Pie Chart */}
        <div className="lg:col-span-1">
          <StatsGrid stats={stats} />
        </div>
      </div>

      {/* Signal History Table */}
      <div>
        <SignalsTable signals={signalHistory} />
      </div>
    </div>
  )
}
