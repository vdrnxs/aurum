"use client"

import { TradingSignal, SignalType } from "@/types/database"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils/formatters"
import { calculatePercentageChange } from "@/lib/utils/calculations"
import { cn } from "@/lib/utils"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

interface SignalCardProps {
  signal: TradingSignal
}

function getSignalVariant(signal: SignalType): "success" | "danger" | "warning" {
  if (signal === 'STRONG_BUY' || signal === 'BUY') return 'success'
  if (signal === 'STRONG_SELL' || signal === 'SELL') return 'danger'
  return 'warning'
}

function getChartColor(variant: "success" | "danger" | "warning"): string {
  if (variant === 'success') return 'var(--success)'
  if (variant === 'danger') return 'var(--danger)'
  return 'var(--warning)'
}

export function SignalCard({ signal }: SignalCardProps) {
  const variant = getSignalVariant(signal.signal)
  const isHold = signal.signal === 'HOLD'

  // Chart configuration
  const chartData = [
    { confidence: signal.confidence, fill: getChartColor(variant) },
  ]

  const chartConfig = {
    confidence: {
      label: "Confidence",
    },
  } satisfies ChartConfig

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        {/* Top row: Symbol and Signal badge */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {signal.symbol}
          </h2>
          <Badge
            variant={variant}
            className="text-sm font-semibold"
          >
            {signal.signal.replace('_', ' ')}
          </Badge>
        </div>

        {isHold ? (
          <div className="rounded-lg border-2 border-border bg-muted p-8 text-center">
            <h3 className="text-3xl font-bold text-foreground">
              Awaiting Opportunity
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">No clear trend detected</p>
          </div>
        ) : (
          <>
            {/* Main content: Chart on left, Prices on right */}
            <div className="flex items-start gap-6">
              {/* Left: Radial Chart for Confidence */}
              <div className="flex items-center justify-center">
                <ChartContainer
                  config={chartConfig}
                  className="aspect-square h-[200px] w-[200px]"
                >
                  <RadialBarChart
                    data={chartData}
                    startAngle={0}
                    endAngle={(signal.confidence / 100) * 360}
                    innerRadius={70}
                    outerRadius={90}
                    width={200}
                    height={200}
                  >
                    <PolarGrid
                      gridType="circle"
                      radialLines={false}
                      stroke="none"
                      className="first:fill-muted last:fill-background"
                      polarRadius={[73, 67]}
                    />
                    <RadialBar dataKey="confidence" background cornerRadius={10} />
                    <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) - 12}
                                  className={cn(
                                    "fill-foreground text-3xl font-bold",
                                    variant === 'success' && "fill-success",
                                    variant === 'danger' && "fill-danger",
                                    variant === 'warning' && "fill-warning"
                                  )}
                                >
                                  {signal.confidence.toFixed(0)}%
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 16}
                                  className="fill-muted-foreground text-sm"
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

              {/* Right: Price Grid */}
              <div className="flex-1 grid grid-cols-1 gap-3">
                {/* Entry Price */}
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Entry Price
                  </p>
                  <p className="mt-1 font-mono text-3xl font-bold text-foreground">
                    {formatPrice(signal.entry_price)}
                  </p>
                </div>

                {/* Stop Loss and Take Profit */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border-l-4 border-danger bg-muted p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Stop Loss
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold text-foreground">
                      {formatPrice(signal.stop_loss)}
                    </p>
                    {signal.entry_price && signal.stop_loss && (
                      <p className="mt-1 text-xs text-danger">
                        -{Math.abs(
                          calculatePercentageChange(signal.entry_price, signal.stop_loss)
                        ).toFixed(2)}%
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border-l-4 border-success bg-muted p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Take Profit
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold text-foreground">
                      {formatPrice(signal.take_profit)}
                    </p>
                    {signal.entry_price && signal.take_profit && (
                      <p className="mt-1 text-xs text-success">
                        +{Math.abs(
                          calculatePercentageChange(signal.entry_price, signal.take_profit)
                        ).toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Analysis */}
        {signal.ai_reasoning && (
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">
              AI Analysis
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {signal.ai_reasoning}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}