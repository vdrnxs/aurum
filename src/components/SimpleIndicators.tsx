import { Card, Title, Text, Button } from '@tremor/react';
import { useCandles } from '../hooks/useCandles';
import { useLatestIndicators } from '../hooks/useIndicators';

export function SimpleIndicators() {
  // Hybrid mode: try cache first, fetch from API if stale, save to DB
  const { candles, loading, error, source, isFresh, refetch } = useCandles('BTC', '1h', 100, {
    source: 'auto', // Auto mode: cache first, API if needed
    maxCacheAgeMs: 2 * 60 * 60 * 1000, // 2 hours (cache is cleaned every 48h)
  });
  const latest = useLatestIndicators(candles);

  if (loading) {
    return (
      <Card>
        <Title>Loading...</Title>
        <Text>Fetching data from Hyperliquid or Supabase...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Title>Error</Title>
        <Text>{error}</Text>
        <Button onClick={refetch} className="mt-4">Retry</Button>
      </Card>
    );
  }

  if (!candles || candles.length === 0) {
    return (
      <Card>
        <Title>No Data</Title>
        <Text>No candles available</Text>
        <Button onClick={refetch} className="mt-4">Load Data</Button>
      </Card>
    );
  }

  if (!latest) {
    return (
      <Card>
        <Title>Not Enough Data</Title>
        <Text>Need at least 50 candles. Got: {candles.length}</Text>
        <Button onClick={refetch} className="mt-4">Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-center">
          <Title>BTC Indicators (1h)</Title>
          <div className="flex gap-2 items-center">
            <Text className="text-sm">
              Source: <span className="font-semibold">{source}</span>
              {source === 'cache' && (
                <span className={isFresh ? 'text-green-600' : 'text-orange-600'}>
                  {' '}({isFresh ? 'fresh' : 'stale'})
                </span>
              )}
            </Text>
            <Button size="xs" onClick={refetch}>Refresh</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Title>Raw Data (Ready for AI)</Title>
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
{JSON.stringify(latest, null, 2)}
        </pre>
        <Button
          size="xs"
          className="mt-4"
          onClick={() => navigator.clipboard.writeText(JSON.stringify(latest, null, 2))}
        >
          Copy JSON
        </Button>
      </Card>

      <Card>
        <Title>Summary (Optimized for 1h BTC)</Title>
        <div className="mt-4 space-y-2">
          <Text>Total candles: {candles.length}</Text>
          <Text>Current price: ${latest.price.toFixed(2)}</Text>
          <Text>SMA(100) ~4 days: ${latest.sma100.toFixed(2)}</Text>
          <Text>RSI(14) standard: {latest.rsi.toFixed(2)}</Text>
          <Text>MACD(24,52,9) swing: {latest.macd.histogram.toFixed(2)}</Text>
        </div>
      </Card>
    </div>
  );
}
