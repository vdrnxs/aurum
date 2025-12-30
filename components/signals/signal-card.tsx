"use client"

import { TradingSignal } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      "flex h-full flex-col border-2 transition-colors",
      variant === 'success' && "border-success/30 bg-success/5",
      variant === 'danger' && "border-danger/30 bg-danger/5",
      variant === 'warning' && "border-warning/30 bg-warning/5"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-medium text-foreground">
              {signal.symbol} - Latest Signal
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              AI-powered trading recommendation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={variant} className="text-xs">
              {signal.signal.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(signal.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-5">
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <ChartContainer config={chartConfig} className="aspect-square h-[140px] w-[140px]">
                <RadialBarChart
                  data={chartData}
                  startAngle={0}
                  endAngle={(signal.confidence / 100) * 360}
                  innerRadius={45}
                  outerRadius={65}
                  width={140}
                  height={140}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    className="first:fill-muted last:fill-background"
                    polarRadius={[50, 40]}
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
                                y={(viewBox.cy || 0) - 6}
                                className={cn(
                                  "text-3xl font-bold",
                                  variant === 'success' && "fill-success",
                                  variant === 'danger' && "fill-danger",
                                  variant === 'warning' && "fill-warning"
                                )}
                              >
                                {signal.confidence.toFixed(0)}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 16}
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
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Entry Price</p>
              <p className="mt-2 font-mono text-4xl font-bold text-foreground">
                {formatPrice(signal.entry_price)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2 rounded-lg border-2 border-danger/50 bg-danger/10 p-5">
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
            <div className="space-y-2 rounded-lg border-2 border-success/50 bg-success/10 p-5">
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
            <div className="rounded-lg border border-border/50 bg-muted/10 p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">AI Analysis</h3>
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