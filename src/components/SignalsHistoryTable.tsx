import {
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Text,
} from '@tremor/react';
import type { TradingSignal, SignalType } from '../types/database';
import { COLORS } from '../lib/styles';

interface SignalsHistoryTableProps {
  signals: TradingSignal[];
}

function getSignalColor(signal: SignalType): string {
  const colors: Record<SignalType, string> = {
    STRONG_BUY: 'emerald',
    BUY: 'green',
    HOLD: 'gray',
    SELL: 'orange',
    STRONG_SELL: 'red',
  };
  return colors[signal];
}

function formatPrice(price: number | null): string {
  if (price === null || price === 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}


export function SignalsHistoryTable({ signals }: SignalsHistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell className="min-w-[160px]">Created At</TableHeaderCell>
            <TableHeaderCell className="text-center">Symbol</TableHeaderCell>
            <TableHeaderCell className="text-center">Interval</TableHeaderCell>
            <TableHeaderCell className="text-center min-w-[120px]">Signal</TableHeaderCell>
            <TableHeaderCell className="text-center min-w-[100px]">Confidence</TableHeaderCell>
            <TableHeaderCell className="text-right min-w-[110px]">Entry Price</TableHeaderCell>
            <TableHeaderCell className="text-right min-w-[110px]">Current Price</TableHeaderCell>
            <TableHeaderCell className="text-right min-w-[110px]">Stop Loss</TableHeaderCell>
            <TableHeaderCell className="text-right min-w-[110px]">Take Profit</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {signals.map((signal) => {
            const signalColor = getSignalColor(signal.signal);
            // Detect HOLD signal
            const isHold = signal.signal === 'HOLD' ||
              (signal.entry_price === signal.stop_loss && signal.stop_loss === signal.take_profit);

            return (
              <TableRow key={signal.id}>
                <TableCell>
                  <Text className="whitespace-nowrap">{formatDateTime(signal.created_at)}</Text>
                </TableCell>

                <TableCell>
                  <div className="flex justify-center">
                    <Badge color="slate" size="sm">
                      {signal.symbol}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell>
                  <Text className="text-center">{signal.interval}</Text>
                </TableCell>

                <TableCell>
                  <div className="flex justify-center">
                    <Badge color={signalColor} size="sm">
                      {signal.signal.replace('_', ' ')}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell>
                  <Text className="text-center font-semibold">{signal.confidence.toFixed(0)}%</Text>
                </TableCell>

                <TableCell className="text-right">
                  {isHold ? (
                    <Text className="font-mono text-gray-500 dark:text-gray-400 italic">
                      {formatPrice(signal.entry_price)}
                    </Text>
                  ) : (
                    <Text className="font-mono font-semibold">{formatPrice(signal.entry_price)}</Text>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <Text className="font-mono font-semibold">{formatPrice(signal.current_price)}</Text>
                </TableCell>

                <TableCell className="text-right">
                  {isHold ? (
                    <Text className="font-mono text-gray-400 dark:text-gray-500 text-sm">—</Text>
                  ) : (
                    <Text className={`${COLORS.loss} font-mono font-semibold`}>{formatPrice(signal.stop_loss)}</Text>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  {isHold ? (
                    <Text className="font-mono text-gray-400 dark:text-gray-500 text-sm">—</Text>
                  ) : (
                    <Text className={`${COLORS.profit} font-mono font-semibold`}>{formatPrice(signal.take_profit)}</Text>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}