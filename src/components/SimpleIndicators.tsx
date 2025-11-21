import {
  Card,
  Title,
  Text,
  Button,
  Metric,
  Badge,
  List,
  ListItem,
  Callout,
} from '@tremor/react';
import { useCandles } from '../hooks/useCandles';
import { useLatestIndicators } from '../hooks/useIndicators';

export function SimpleIndicators() {
  const { candles, loading, error, source, isFresh, refetch } = useCandles('BTC', '1h', 100, {
    source: 'auto',
    maxCacheAgeMs: 1 * 60 * 60 * 1000,
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
      <Callout title="Error" color="red">
        {error}
        <Button onClick={refetch} className="mt-4">Retry</Button>
      </Callout>
    );
  }

  if (!candles || candles.length === 0) {
    return (
      <Callout title="No Data" color="yellow">
        No candles available
        <Button onClick={refetch} className="mt-4">Load Data</Button>
      </Callout>
    );
  }

  if (!latest) {
    return (
      <Callout title="Not Enough Data" color="yellow">
        Need at least 50 candles. Got: {candles.length}
        <Button onClick={refetch} className="mt-4">Retry</Button>
      </Callout>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between items-center">
          <Title>BTC Indicators (1h)</Title>
          <div className="flex gap-2 items-center">
            <Badge color={source === 'api' ? 'blue' : 'gray'}>{source}</Badge>
            {source === 'cache' && (
              <Badge color={isFresh ? 'green' : 'orange'}>
                {isFresh ? 'fresh' : 'stale'}
              </Badge>
            )}
            <Button size="xs" onClick={refetch}>Refresh</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Title>Current Price</Title>
        <Metric>${latest.price.toFixed(2)}</Metric>
        <Text className="mt-2">Based on {candles.length} candles</Text>
      </Card>

      <Card>
        <Title>Technical Indicators</Title>
        <List className="mt-4">
          <ListItem>
            <span>SMA(100) ~4 days</span>
            <span>${latest.sma100.toFixed(2)}</span>
          </ListItem>
          <ListItem>
            <span>RSI(14) standard</span>
            <Badge color={latest.rsi > 70 ? 'red' : latest.rsi < 30 ? 'green' : 'gray'}>
              {latest.rsi.toFixed(2)}
            </Badge>
          </ListItem>
          <ListItem>
            <span>MACD(24,52,9) histogram</span>
            <Badge color={latest.macd.histogram > 0 ? 'green' : 'red'}>
              {latest.macd.histogram.toFixed(2)}
            </Badge>
          </ListItem>
        </List>
      </Card>

      <Card>
        <Title>Raw Data (Ready for AI)</Title>
        <pre className="mt-4 p-4 rounded-tremor-default text-tremor-default overflow-auto bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle text-tremor-content-strong dark:text-dark-tremor-content-strong">
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
    </div>
  );
}
