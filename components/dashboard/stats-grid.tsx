"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface StatsGridProps {
  stats: {
    totalSignals: number
    buySignals: number
    sellSignals: number
  }
}

const chartConfig = {
  signals: {
    label: "Signals",
  },
  buy: {
    label: "Buy",
    theme: {
      light: "oklch(0.55 0.15 145)",
      dark: "oklch(0.7 0.17 142)",
    },
  },
  sell: {
    label: "Sell",
    theme: {
      light: "oklch(0.55 0.22 25)",
      dark: "oklch(0.65 0.24 27)",
    },
  },
  hold: {
    label: "Hold",
    theme: {
      light: "oklch(0.75 0.15 85)",
      dark: "oklch(0.85 0.18 87)",
    },
  },
} satisfies ChartConfig

export function StatsGrid({ stats }: StatsGridProps) {
  const holdSignals = stats.totalSignals - stats.buySignals - stats.sellSignals

  const chartData = React.useMemo(() => {
    const data = []

    if (stats.buySignals > 0) {
      data.push({
        type: "buy",
        count: stats.buySignals,
        fill: "var(--color-buy)",
      })
    }

    if (stats.sellSignals > 0) {
      data.push({
        type: "sell",
        count: stats.sellSignals,
        fill: "var(--color-sell)",
      })
    }

    if (holdSignals > 0) {
      data.push({
        type: "hold",
        count: holdSignals,
        fill: "var(--color-hold)",
      })
    }

    return data
  }, [stats.buySignals, stats.sellSignals, holdSignals])

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 items-center justify-center p-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[280px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
              stroke="none"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {stats.totalSignals.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 28}
                          className="fill-muted-foreground text-sm"
                        >
                          Total Signals
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}