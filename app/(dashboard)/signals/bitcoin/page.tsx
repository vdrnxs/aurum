"use client"

import { useEffect, useState } from "react"
import { SignalsTable } from "@/components/signals/signals-table"
import { SignalStats } from "@/components/dashboard/signal-stats"
import { SignalCard } from "@/components/signals/signal-card"
import { getSignalHistory } from "@/lib/services/signals-service"
import { TradingSignal } from "@/types/database"

export default function BitcoinSignalsPage() {
  const [signalHistory, setSignalHistory] = useState<TradingSignal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const history = await getSignalHistory('BTC')
        setSignalHistory(history)
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
      <div className="animate-pulse space-y-6">
        {/* KPIs skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted" />
          ))}
        </div>

        {/* Latest signal skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>

        {/* Table skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-28 rounded bg-muted" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const latestSignal = signalHistory[0]

  return (
    <div className="space-y-6">
      <SignalStats signals={signalHistory} />

      {latestSignal && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Latest Signal</h2>
          <SignalCard signal={latestSignal} />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Signal History</h2>
        <SignalsTable signals={signalHistory} />
      </div>
    </div>
  )
}
