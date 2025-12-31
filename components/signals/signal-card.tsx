"use client"

import { TradingSignal } from "@/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils/formatters"
import { calculatePercentageChange } from "@/lib/utils/calculations"
import { getSignalVariant, getChartColor } from "@/lib/utils/signal-helpers"
import { cn } from "@/lib/utils"
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"

interface SignalCardProps {
  signal: TradingSignal
}

export function SignalCard({ signal }: SignalCardProps) {
  const variant = getSignalVariant(signal.signal)
  const chartData = [{ confidence: signal.confidence, fill: getChartColor(variant) }]
  const chartConfig = { confidence: { label: "Confidence" } } satisfies ChartConfig

  return (
    <Card className={cn(
      "flex h-full flex-col border-2 transition-colors p-5",
      variant === 'success' && "border-success/30 bg-success/5",
      variant === 'danger' && "border-danger/30 bg-danger/5",
      variant === 'warning' && "border-warning/30 bg-warning/5"
    )}>
      <CardContent className="flex-1 p-0">
        <div className="space-y-3">
          {/* Row 1: Confidence Chart + Entry Price + Badge */}
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0">
              <ChartContainer config={chartConfig} className="aspect-square h-[120px] w-[120px]">
                <RadialBarChart
                  data={chartData}
                  startAngle={0}
                  endAngle={(signal.confidence / 100) * 360}
                  innerRadius={40}
                  outerRadius={55}
                  width={120}
                  height={120}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    className="first:fill-muted last:fill-background"
                    polarRadius={[45, 35]}
                  />
                  <RadialBar dataKey="confidence" background cornerRadius={10} />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 4}
                                className={cn(
                                  "text-2xl font-bold",
                                  variant === 'success' && "fill-success",
                                  variant === 'danger' && "fill-danger",
                                  variant === 'warning' && "fill-warning"
                                )}
                              >
                                {signal.confidence.toFixed(0)}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 14}
                                className="fill-muted-foreground text-xs"
                              >
                                Confidence
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entry Price</p>
              <p className="mt-1 font-mono text-3xl font-bold text-foreground">
                {formatPrice(signal.entry_price)}
              </p>
            </div>

            <Badge variant={variant} className="self-start text-xs">
              {signal.signal.replace('_', ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 rounded-lg border-2 border-danger/50 bg-danger/10 p-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-danger">Stop Loss</p>
              <p className="font-mono text-2xl font-bold text-foreground">
                {formatPrice(signal.stop_loss)}
              </p>
              {signal.entry_price && signal.stop_loss && (
                <p className="text-sm font-semibold text-danger">
                  -{Math.abs(calculatePercentageChange(signal.entry_price, signal.stop_loss)).toFixed(1)}%
                </p>
              )}
            </div>
            <div className="space-y-1.5 rounded-lg border-2 border-success/50 bg-success/10 p-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-success">Take Profit</p>
              <p className="font-mono text-2xl font-bold text-foreground">
                {formatPrice(signal.take_profit)}
              </p>
              {signal.entry_price && signal.take_profit && (
                <p className="text-sm font-semibold text-success">
                  +{Math.abs(calculatePercentageChange(signal.entry_price, signal.take_profit)).toFixed(1)}%
                </p>
              )}
            </div>
          </div>

          {signal.ai_reasoning && (
            <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
              <h3 className="mb-1.5 text-sm font-semibold text-foreground">AI Analysis</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {signal.ai_reasoning}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}