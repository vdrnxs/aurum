import { TradingSignal, SignalType } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDateTime } from "@/lib/utils/formatters"
import { cn } from "@/lib/utils"

interface SignalsTableProps {
  signals: TradingSignal[]
}

function getSignalVariant(signal: SignalType): "success" | "danger" | "warning" {
  if (signal === 'STRONG_BUY' || signal === 'BUY') return 'success'
  if (signal === 'STRONG_SELL' || signal === 'SELL') return 'danger'
  return 'warning'
}

export function SignalsTable({ signals }: SignalsTableProps) {
  if (signals.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No signals available</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created At
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Symbol
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Signal
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Confidence
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Entry
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Stop Loss
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Take Profit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {signals.map((signal) => {
              const variant = getSignalVariant(signal.signal)
              const isHold = signal.signal === 'HOLD'

              return (
                <tr key={signal.id} className="transition-colors hover:bg-accent">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                    {formatDateTime(signal.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary" className="text-xs">
                      {signal.symbol}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={variant} className="text-xs">
                      {signal.signal.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-foreground">
                      {signal.confidence.toFixed(0)}%
                    </span>
                  </td>
                  <td className={cn(
                    "px-4 py-3 text-right font-mono text-sm",
                    isHold ? "text-muted-foreground italic" : "font-semibold text-foreground"
                  )}>
                    {formatPrice(signal.entry_price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isHold ? (
                      <span className="text-sm text-muted-foreground">—</span>
                    ) : (
                      <span className="font-mono text-sm font-semibold text-danger">
                        {formatPrice(signal.stop_loss)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isHold ? (
                      <span className="text-sm text-muted-foreground">—</span>
                    ) : (
                      <span className="font-mono text-sm font-semibold text-success">
                        {formatPrice(signal.take_profit)}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}