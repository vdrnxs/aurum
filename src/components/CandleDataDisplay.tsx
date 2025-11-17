import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import type { Candle } from '../types/database';

interface CandleDataDisplayProps {
  candles: Candle[];
}

export function CandleDataDisplay({ candles }: CandleDataDisplayProps) {
  if (candles.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-gray-500">No data available</p>
      </div>
    );
  }

  const formatPrice = (price: number) => price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatVolume = (volume: number) => volume.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="overflow-x-auto">
      <div className="w-full overflow-auto whitespace-nowrap">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Symbol</TableHeaderCell>
              <TableHeaderCell>Interval</TableHeaderCell>
              <TableHeaderCell>Time</TableHeaderCell>
              <TableHeaderCell className="text-right">Open</TableHeaderCell>
              <TableHeaderCell className="text-right">High</TableHeaderCell>
              <TableHeaderCell className="text-right">Low</TableHeaderCell>
              <TableHeaderCell className="text-right">Close</TableHeaderCell>
              <TableHeaderCell className="text-right">Change</TableHeaderCell>
              <TableHeaderCell className="text-right">Volume</TableHeaderCell>
              <TableHeaderCell className="text-right">Trades</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {candles.map((candle) => {
              const priceChange = candle.close - candle.open;
              const priceChangePercent = ((priceChange / candle.open) * 100).toFixed(2);
              const isPositive = priceChange >= 0;

              return (
                <TableRow key={candle.id}>
                  <TableCell>{candle.symbol}</TableCell>
                  <TableCell>{candle.interval}</TableCell>
                  <TableCell>{formatDate(candle.open_time)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatPrice(candle.open)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-emerald-600">
                    {formatPrice(candle.high)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-red-600">
                    {formatPrice(candle.low)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatPrice(candle.close)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono tabular-nums ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{priceChangePercent}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatVolume(candle.volume)}</TableCell>
                  <TableCell className="text-right">{candle.trades_count}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
