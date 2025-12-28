import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react"

interface StatsGridProps {
  stats: {
    totalSignals: number
    buySignals: number
    sellSignals: number
    avgConfidence: number
  }
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Signals
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.totalSignals}
          </div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Buy Signals
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {stats.buySignals}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalSignals > 0
              ? `${((stats.buySignals / stats.totalSignals) * 100).toFixed(0)}% of total`
              : 'No data'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sell Signals
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-danger" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-danger">
            {stats.sellSignals}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalSignals > 0
              ? `${((stats.sellSignals / stats.totalSignals) * 100).toFixed(0)}% of total`
              : 'No data'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Confidence
          </CardTitle>
          <Target className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats.avgConfidence.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground">Across all signals</p>
        </CardContent>
      </Card>
    </div>
  )
}