"use client"

import { useEffect, useState } from "react"
import { SignalCard } from "@/components/signals/signal-card"
import { SignalsTable } from "@/components/signals/signals-table"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { getLatestSignal, getSignalHistory, getSignalStats } from "@/lib/services/signals-service"
import { TradingSignal } from "@/types/database"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardPage() {
  const [latestSignal, setLatestSignal] = useState<TradingSignal | null>(null)
  const [signalHistory, setSignalHistory] = useState<TradingSignal[]>([])
  const [stats, setStats] = useState({
    totalSignals: 0,
    buySignals: 0,
    sellSignals: 0,
    avgConfidence: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [latest, history, statsData] = await Promise.all([
          getLatestSignal(),
          getSignalHistory(),
          getSignalStats(),
        ])

        setLatestSignal(latest)
        setSignalHistory(history)
        setStats(statsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 w-20 rounded bg-surface-hover" />
                <div className="mt-2 h-8 w-16 rounded bg-surface-hover" />
                <div className="mt-2 h-3 w-24 rounded bg-surface-hover" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 rounded bg-surface-hover" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Latest Signal */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Latest Signal
        </h2>
        {latestSignal ? (
          <SignalCard signal={latestSignal} />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted">No signals available yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Signal History */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Signal History
        </h2>
        <SignalsTable signals={signalHistory} />
      </div>
    </div>
  )
}