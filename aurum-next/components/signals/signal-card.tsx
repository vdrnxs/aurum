import { TradingSignal, SignalType } from "@/types/database"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils/formatters"
import { calculateRiskReward, calculatePercentageChange } from "@/lib/utils/calculations"
import { cn } from "@/lib/utils"

interface SignalCardProps {
  signal: TradingSignal
}

function getSignalVariant(signal: SignalType): "success" | "danger" | "warning" {
  if (signal === 'STRONG_BUY' || signal === 'BUY') return 'success'
  if (signal === 'STRONG_SELL' || signal === 'SELL') return 'danger'
  return 'warning'
}

export function SignalCard({ signal }: SignalCardProps) {
  const variant = getSignalVariant(signal.signal)
  const riskReward = calculateRiskReward(
    signal.entry_price,
    signal.stop_loss,
    signal.take_profit,
    signal.signal
  )
  const isHold = signal.signal === 'HOLD'

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {signal.symbol}
            </Badge>
            <h2 className="text-2xl font-bold text-foreground">
              {signal.signal.replace('_', ' ')}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Confidence
            </p>
            <p className={cn(
              "text-2xl font-semibold",
              variant === 'success' && "text-success",
              variant === 'danger' && "text-danger",
              variant === 'warning' && "text-warning"
            )}>
              {signal.confidence.toFixed(0)}%
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isHold ? (
          <div className="rounded-lg border-2 border-border bg-muted p-6 text-center">
            <h3 className="text-3xl font-bold text-foreground">
              Awaiting Opportunity
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">No clear trend detected</p>
          </div>
        ) : (
          <>
            {/* Entry Price */}
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Entry Price
              </p>
              <p className="mt-1 font-mono text-4xl font-bold text-foreground">
                {formatPrice(signal.entry_price)}
              </p>
            </div>

            {/* Risk Management Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

              <div className="rounded-lg border-l-4 border-primary bg-muted p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Risk/Reward
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-foreground">
                  {riskReward ? `1:${riskReward.toFixed(2)}` : 'N/A'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {riskReward && riskReward >= 2 ? 'Favorable' : riskReward ? 'Moderate' : ''}
                </p>
              </div>
            </div>
          </>
        )}

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