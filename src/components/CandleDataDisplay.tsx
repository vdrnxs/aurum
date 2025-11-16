import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell } from '@tremor/react';
import type { Candle } from '../types/database';

interface CandleDataDisplayProps {
  candles: Candle[];
}

export function CandleDataDisplay({ candles }: CandleDataDisplayProps) {
  if (candles.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-zinc-600 text-sm">No data available</p>
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
    <div className="w-full">
      <Table>
        <TableHead>
          <TableRow className="border-b border-zinc-800">
            <TableHeaderCell className="text-zinc-400 font-normal text-xs uppercase tracking-wider py-4 w-20">Symbol</TableHeaderCell>
            <TableHeaderCell className="text-zinc-400 font-normal text-xs uppercase tracking-wider py-4 w-24">Interval</TableHeaderCell>
            <TableHeaderCell className="text-zinc-400 font-normal text-xs uppercase tracking-wider py-4 w-40">Time</TableHeaderCell>
            <TableHeaderCell className="text-right text-zinc-400 font-normal text-xs uppercase tracking-wider py-4 w-32">Open</TableHeaderCell>
            <TableHeaderCell className="text-right text-zinc-400 font-normal text-xs uppercase tracking-wider py-4 w-32">High</TableHeaderCell>
            <TableHeaderCell className="text-right text-zinc-400 font-normal text-xs uppercase tracking-wider py-4 w-32">Low</TableHeaderCell>
            <TableHeaderCell className="text-right text-zinc-400 font-normal text-xs uppercase tracking-wider py-4 w-32">Close</TableHeaderCell>
            <TableHeaderCell className="text-right text-zinc-400 font-normal text-xs uppercase tracking-wider py-4 w-28">Change</TableHeaderCell>
            <TableHeaderCell className="text-right text-zinc-400 font-normal text-xs uppercase tracking-wider py-4 w-32">Volume</TableHeaderCell>
            <TableHeaderCell className="text-right text-zinc-400 font-normal text-xs uppercase tracking-wider py-4 w-24">Trades</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {candles.map((candle) => {
            const priceChange = candle.close - candle.open;
            const priceChangePercent = ((priceChange / candle.open) * 100).toFixed(2);
            const isPositive = priceChange >= 0;

            return (
              <TableRow key={candle.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                <TableCell className="text-zinc-100 font-medium py-5">{candle.symbol}</TableCell>
                <TableCell className="text-zinc-300 text-sm py-5">{candle.interval}</TableCell>
                <TableCell className="text-zinc-400 text-sm py-5">{formatDate(candle.open_time)}</TableCell>
                <TableCell className="text-right text-zinc-200 font-mono text-sm py-5">{formatPrice(candle.open)}</TableCell>
                <TableCell className="text-right text-teal-400 font-mono text-sm py-5">{formatPrice(candle.high)}</TableCell>
                <TableCell className="text-right text-red-400 font-mono text-sm py-5">{formatPrice(candle.low)}</TableCell>
                <TableCell className="text-right text-zinc-100 font-mono text-sm font-medium py-5">{formatPrice(candle.close)}</TableCell>
                <TableCell className="text-right py-5">
                  <span className={`font-mono text-sm font-medium ${isPositive ? 'text-teal-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{priceChangePercent}%
                  </span>
                </TableCell>
                <TableCell className="text-right text-zinc-400 font-mono text-sm py-5">{formatVolume(candle.volume)}</TableCell>
                <TableCell className="text-right text-zinc-500 text-sm py-5">{candle.trades_count}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
